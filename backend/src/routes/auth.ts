import { Router, Request, Response, RequestHandler } from 'express';
import ms from 'ms';
import jwt, { Secret, JwtPayload as OfficialJwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import passport from 'passport';
import {
  ValidationError,
  UniqueConstraintError,
  ValidationErrorItem,
} from 'sequelize';

import User from '@models/user';
import BlacklistedToken from '@models/blacklistedToken';
import checkBlacklist from '@middleware/checkBlacklist';
import '@config/passport.config';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const router: Router = Router();

const JWT_EXPIRATION: string = process.env.JWT_EXPIRATION || '1h';
const JWT_SECRET: Secret | undefined = process.env.JWT_SECRET;
const authenticateJwt: RequestHandler = passport.authenticate('jwt', {
  session: false,
});

interface RegisterRequestBody {
  name?: string;
  email?: string;
  password?: string;
}
interface LoginRequestBody {
  email?: string;
  password?: string;
}
interface CustomJwtPayload extends OfficialJwtPayload {
  id: number;
}

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     description: Создает нового пользователя в системе с хешированным паролем.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistrationInput'
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Регистрация успешна"
 *       400:
 *         description: Ошибка валидации или Email уже используется
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Необходимо указать имя, email и пароль | Email уже используется | Ошибка валидации: <сообщение>"
 *       500:
 *         description: Ошибка сервера
 *
 * components:
 *   schemas:
 *     UserRegistrationInput:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: Имя пользователя
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: Email пользователя
 *           example: "john.doe@example.com"
 *         password:
 *           type: string
 *           format: password
 *           description: Пароль пользователя (мин. 6 символов)
 *           example: "password123"
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body as RegisterRequestBody;
  if (!name || !email || !password) {
    res.status(400).json({ message: 'Необходимо указать имя, email и пароль' });
    return;
  }
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'Email уже используется' });
      return;
    }
    await User.create({ name, email, password });
    res.status(201).json({ message: 'Регистрация успешна' });
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      const validationErrors = error.errors as ValidationErrorItem[];
      const messages = validationErrors.map((err) => err.message);
      res
        .status(400)
        .json({ message: `Ошибка валидации: ${messages.join(', ')}` });
      return;
    }
    if (error instanceof UniqueConstraintError) {
      res
        .status(400)
        .json({ message: 'Email уже используется (ошибка уникальности).' });
      return;
    }
    console.error('Ошибка при регистрации пользователя:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Ошибка сервера при регистрации' });
    }
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Вход пользователя в систему (аутентификация)
 *     tags: [Auth]
 *     description: Аутентифицирует пользователя по email и паролю, возвращает JWT токен при успехе.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLoginInput'
 *     responses:
 *       200:
 *         description: Аутентификация успешна, возвращен JWT токен.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT токен доступа (включая префикс 'Bearer ')
 *                   example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjIzNDUwNjY3LCJleHAiOjE2MjM0NTQyNjd9.exampleTokenSignature"
 *       400:
 *         description: Не предоставлены email или пароль.
 *       401:
 *         description: Неверный email или пароль.
 *       500:
 *         description: Ошибка сервера или ошибка конфигурации JWT.
 *
 * components:
 *   schemas:
 *     UserLoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email пользователя
 *           example: "john.doe@example.com"
 *         password:
 *           type: string
 *           format: password
 *           description: Пароль пользователя
 *           example: "password123"
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as LoginRequestBody;
  if (!email || !password) {
    res.status(400).json({ message: 'Необходимо указать email и пароль' });
    return;
  }
  if (!JWT_SECRET) {
    console.error('Критическая ошибка: JWT_SECRET не определен для входа!');
    res.status(500).json({ message: 'Ошибка конфигурации сервера' });
    return;
  }
  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.checkPassword(password))) {
      res.status(401).json({ message: 'Неверный email или пароль' });
      return;
    }
    const payload: CustomJwtPayload = { id: user.id };
    let expiresInSeconds: number;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msValue = ms(JWT_EXPIRATION as any);
      if (typeof msValue !== 'number')
        throw new Error(`ms function returned non-number: ${msValue}`);
      expiresInSeconds = Math.floor(msValue / 1000);
      if (isNaN(expiresInSeconds) || expiresInSeconds <= 0)
        throw new Error('Invalid expiration time calculated');
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error(
        `Некорректный формат или значение JWT_EXPIRATION: ${JWT_EXPIRATION}. Ошибка: ${errorMessage}`,
      );
      res
        .status(500)
        .json({ message: 'Ошибка конфигурации сервера (JWT Expiration)' });
      return;
    }
    const token = jwt.sign(payload, JWT_SECRET!, {
      expiresIn: expiresInSeconds,
    });
    res.status(200).json({
      token: `Bearer ${token}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: unknown) {
    console.error('Ошибка при входе пользователя:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Ошибка сервера при входе' });
    }
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Выход пользователя из системы (Инвалидация токена)
 *     tags: [Auth]
 *     description: Добавляет текущий используемый JWT токен в черный список, делая его недействительным для последующих запросов. Требуется аутентификация.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Выход из системы выполнен успешно или токен уже был аннулирован.
 *       401:
 *         description: Ошибка аутентификации (токен не предоставлен, недействителен, истек или уже в черном списке).
 *       422:
 *         description: Не удалось извлечь токен из заголовка.
 *       500:
 *         description: Ошибка сервера или ошибка конфигурации JWT.
 */
router.post(
  '/logout',
  checkBlacklist,
  authenticateJwt,
  async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(422).json({
        message:
          'Токен не найден или неверный формат в заголовке Authorization',
      });
      return;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(422).json({ message: 'Не удалось извлечь токен' });
      return;
    }
    if (!JWT_SECRET) {
      console.error('Критическая ошибка: JWT_SECRET не определен для выхода!');
      res.status(500).json({ message: 'Ошибка конфигурации сервера' });
      return;
    }
    try {
      let decoded: CustomJwtPayload;
      try {
        decoded = jwt.verify(token, JWT_SECRET) as CustomJwtPayload;
      } catch (verifyError: unknown) {
        if (
          verifyError instanceof jwt.JsonWebTokenError ||
          verifyError instanceof jwt.NotBeforeError ||
          verifyError instanceof jwt.TokenExpiredError
        ) {
          console.error(
            'Ошибка верификации токена при выходе:',
            verifyError.message,
          );
        } else {
          console.error(
            'Неизвестная ошибка верификации токена при выходе:',
            verifyError,
          );
        }
        res.status(401).json({ message: 'Недействительный токен' });
        return;
      }
      const expiresAtTimestamp = decoded.exp;
      if (!expiresAtTimestamp || typeof expiresAtTimestamp !== 'number') {
        console.error(
          'Не удалось определить срок истечения токена (exp):',
          decoded,
        );
        res
          .status(500)
          .json({ message: 'Не удалось определить срок истечения токена' });
        return;
      }
      const expiresAtDate = new Date(expiresAtTimestamp * 1000);
      try {
        await BlacklistedToken.create({ token, expiresAt: expiresAtDate });
        res.status(200).json({ message: 'Вы успешно вышли из системы' });
      } catch (dbError: unknown) {
        if (dbError instanceof UniqueConstraintError) {
          res.status(200).json({ message: 'Токен уже был аннулирован' });
          return;
        }
        throw dbError;
      }
    } catch (error: unknown) {
      console.error('Ошибка при выходе из системы:', error);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ message: 'Ошибка сервера при выходе из системы' });
      }
    }
  },
);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Получение данных профиля текущего пользователя
 *     tags: [Auth]
 *     description: Возвращает информацию о пользователе (id, name, email), который аутентифицирован с помощью JWT.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Успешный ответ с данными пользователя.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Ошибка аутентификации (токен не предоставлен, недействителен, истек или в черном списке).
 *       500:
 *         description: Внутренняя ошибка сервера.
 */
router.get(
  '/profile',
  [checkBlacklist as RequestHandler, authenticateJwt as RequestHandler],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User | undefined;
      if (!user || typeof user.id !== 'number') {
        res.status(401).json({ message: 'Не авторизован' });
        return;
      }
      const userProfile = await User.findByPk(user.id, {
        attributes: { exclude: ['password'] },
      });
      if (!userProfile) {
        res.status(404).json({ message: 'Пользователь не найден' });
        return;
      }
      console.log(`Returning profile for user ID: ${userProfile.id}`);
      res.status(200).json(userProfile);
    } catch (error: unknown) {
      console.error('Ошибка при получении профиля пользователя:', error);
      const message =
        error instanceof Error ? error.message : 'Unknown server error';
      if (!res.headersSent) {
        res.status(500).json({
          message: 'Ошибка сервера при получении профиля',
          details: message,
        });
      }
    }
  },
);

export default router;
