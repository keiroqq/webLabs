const express = require("express");
const router = express.Router();
const User = require("../models/user");

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
 *     tags: [Users] # Привязываем эндпоинт к тегу Users
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
router.get("/", async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "createdAt"],
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Ошибка при получении списка пользователей:", error);
    res
      .status(500)
      .json({ message: "Ошибка сервера при получении пользователей" });
  }
});

module.exports = router;
