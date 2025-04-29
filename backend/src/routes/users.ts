import { Router, Request, Response } from 'express';
import User from '../models/user.js';

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Операции с пользователями (получение списка)
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Получение списка всех пользователей
 *     tags: [Users]
 *     description: Возвращает массив всех зарегистрированных пользователей из базы данных. Поле `password` исключается из ответа.
 *     responses:
 *       200:
 *         description: Успешный ответ со списком пользователей.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Внутренняя ошибка сервера.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ошибка сервера при получении пользователей"
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const users: User[] = await User.findAll({
      attributes: ['id', 'name', 'email', 'createdAt'],
      raw: false,
    });

    res.status(200).json(users);
  } catch (error: unknown) {
    console.error('Ошибка при получении списка пользователей:', error);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ message: 'Ошибка сервера при получении пользователей' });
    }
  }
});

export default router;
