const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const BlacklistedToken = require('../models/blacklistedToken');
const passport = require('passport');
const authenticateJwt = passport.authenticate('jwt', { session: false });
const checkBlacklist = require('../middleware/checkBlacklist');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const JWT_EXPIRATION = '1h';

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
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: Имя пользователя
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email пользователя
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Пароль пользователя (мин. 6 символов - желательно добавить проверку)
 *                 example: "password123"
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
 *         description: Ошибка валидации (не все поля, email уже используется, неверный формат email, короткий пароль и т.д.)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Необходимо указать имя, email и пароль"
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ошибка сервера"
 */

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Необходимо указать имя, email и пароль" });
    }
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email уже используется" });
    }
    await User.create({ name, email, password });
    res.status(201).json({ message: "Регистрация успешна" });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json({ message: `Ошибка валидации: ${messages.join(', ')}` });
    }
     if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: "Email уже используется." });
    }
    console.error("Ошибка при регистрации пользователя:", error);
    res.status(500).json({ message: "Ошибка сервера при регистрации" });
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
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email пользователя
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Пароль пользователя
 *                 example: "password123"
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
 *                   example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqb2huLmRvZUBleGFtcGxlLmNvbSIsImlhdCI6MTcxNTY3ODkwNSwiZXhwIjoxNzE1NjgyNTA1fQ.exampleTokenSignature"
 *       400:
 *         description: Не предоставлены email или пароль.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Необходимо указать email и пароль"
 *       401:
 *         description: Неверный email или пароль.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Неверный email или пароль"
 *       500:
 *         description: Ошибка сервера.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ошибка сервера при входе"
 */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Необходимо указать email и пароль" });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Неверный email или пароль" });
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Неверный email или пароль" });
    }

    const payload = {
      id: user.id,
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("JWT_SECRET не определен в переменных окружения!");
        return res.status(500).json({ message: "Ошибка конфигурации сервера" });
    }

    const token = jwt.sign(
        payload,
        secret,
        { expiresIn: JWT_EXPIRATION }
    );

    res.status(200).json({ token: `Bearer ${token}` });

  } catch (error) {
    console.error("Ошибка при входе пользователя:", error);
    res.status(500).json({ message: "Ошибка сервера при входе" });
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
 *       - bearerAuth: [] # Этот эндпоинт защищен
 *     responses:
 *       200:
 *         description: Выход из системы выполнен успешно, токен добавлен в черный список.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Вы успешно вышли из системы"
 *       401:
 *         description: Ошибка аутентификации (токен не предоставлен, недействителен, истек или уже в черном списке).
 *       422:
 *         description: Не удалось извлечь токен из заголовка.
 *         content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: "Токен не найден в заголовке Authorization"
 *       500:
 *         description: Ошибка сервера.
 */

router.post('/logout', checkBlacklist, authenticateJwt, async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
  
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(422).json({ message: "Токен не найден или неверный формат в заголовке Authorization" });
      }
  
      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET;
      if (!secret) {
          console.error("JWT_SECRET не определен!");
          return res.status(500).json({ message: "Ошибка конфигурации сервера" });
      }
  
      let decoded;
      try {
          decoded = jwt.verify(token, secret);
      } catch (verifyError) {
          console.error("Ошибка верификации токена при выходе:", verifyError);
          return res.status(401).json({ message: "Недействительный токен" });
      }
  
      const expiresAtTimestamp = decoded.exp;
      if (!expiresAtTimestamp) {
          return res.status(500).json({ message: "Не удалось определить срок истечения токена" });
      }
      const expiresAtDate = new Date(expiresAtTimestamp * 1000);
  
      try {
        await BlacklistedToken.create({
          token: token,
          expiresAt: expiresAtDate,
        });
        res.status(200).json({ message: "Вы успешно вышли из системы" });
      } catch (dbError) {
        if (dbError.name === 'SequelizeUniqueConstraintError') {
          return res.status(200).json({ message: "Токен уже был аннулирован" });
        }
        throw dbError;
      }
  
    } catch (error) {
      console.error("Ошибка при выходе из системы:", error);
      res.status(500).json({ message: "Ошибка сервера при выходе из системы" });
    }
  });

module.exports = router;