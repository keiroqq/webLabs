const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const express = require("express");
const router = express.Router();
const Event = require("../models/event");
const User = require("../models/user");
const { Op } = require("sequelize");
const passport = require("passport");
const authenticateJwt = passport.authenticate("jwt", { session: false });
const checkBlacklist = require("../middleware/checkBlacklist");

const checkEventLimit = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    if (!userId) {
      console.error(
        "Ошибка в checkEventLimit: req.user.id не найден после аутентификации."
      );
      return res
        .status(401)
        .json({
          message: "Пользователь не аутентифицирован (ошибка проверки лимита)",
        });
    }

    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    const eventsCount = await Event.count({
      where: {
        createdBy: userId,
        createdAt: { [Op.gte]: startOfDay, [Op.lt]: endOfDay },
      },
    });

    const maxEventsPerDay = parseInt(process.env.MAX_EVENTS_PER_DAY || "5");

    if (eventsCount >= maxEventsPerDay) {
      return res.status(429).json({
        message: `Превышен лимит (${maxEventsPerDay}) создаваемых мероприятий в день`,
      });
    }
    next();
  } catch (error) {
    console.error("Ошибка при проверке лимита:", error);
    res.status(500).json({ message: "Ошибка сервера при проверке лимита" });
  }
};

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Получение списка всех мероприятий
 *     description: Возвращает список всех мероприятий из базы данных
 *     responses:
 *       200:
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
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
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    let where = {};
    if (category) {
      where.category = { [Op.eq]: category };
    }
    const events = await Event.findAll({ where: where });
    res.status(200).json(events);
  } catch (error) {
    console.error("Ошибка при получении мероприятий:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Получение мероприятия по ID (Публичный)
 *     tags: [Events]
 *     description: Возвращает мероприятие по указанному ID. Доступен всем пользователям.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer # Тип данных параметра - целое число
 *         description: Уникальный идентификатор (ID) мероприятия для получения # Описание параметра
 *     responses:
 *       200:
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: Мероприятие не найдено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Мероприятие не найдено"
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
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (event) {
      res.status(200).json(event);
    } else {
      res.status(404).json({ message: "Мероприятие не найдено" });
    }
  } catch (error) {
    console.error("Ошибка при получении мероприятия:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Создание нового мероприятия (Защищено)
 *     tags: [Events] # Добавляем тег
 *     description: Создает новое мероприятие. Требуется аутентификация (JWT Bearer Token). Проверяет дневной лимит на создание мероприятий.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             # Убираем createdBy из схемы запроса, т.к. он берется из токена
 *             type: object
 *             required:
 *               - title
 *               - date
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               category:
 *                 type: string
 *                 enum: [concert, lecture, exhibition]
 *           # $ref: '#/components/schemas/Event' - Можно убрать ref и определить явно без createdBy
 *     responses:
 *       201:
 *         description: Мероприятие успешно создано
 *         # ... (content schema: $ref: '#/components/schemas/Event') ...
 *       400:
 *         description: Ошибка валидации данных (например, не указаны обязательные поля)
 *       401:
 *         description: Ошибка аутентификации (токен не предоставлен, недействителен или истек)
 *       403:
 *         description: Ошибка авторизации (например, пользователь найден, но не имеет прав - здесь неактуально)
 *       429:
 *         description: Превышен лимит создаваемых мероприятий в день
 *       500:
 *         description: Ошибка сервера
 */
router.post(
  "/",
  checkBlacklist,
  authenticateJwt,
  checkEventLimit,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { title, description, date, category } = req.body;

      if (!title || !date || !category) {
        return res
          .status(400)
          .json({ message: "Необходимо указать title, date и category" });
      }

      const newEvent = await Event.create({
        title,
        description,
        date,
        createdBy: userId,
        category,
      });
      res.status(201).json(newEvent);
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        const messages = error.errors.map((err) => err.message);
        return res
          .status(400)
          .json({ message: `Ошибка валидации: ${messages.join(", ")}` });
      }
      console.error("Ошибка при создании мероприятия:", error);
      res
        .status(500)
        .json({ message: "Ошибка сервера при создании мероприятия" });
    }
  }
);

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Обновление мероприятия (Защищено)
 *     tags: [Events]
 *     description: Обновляет существующее мероприятие по ID. Требуется аутентификация. (Дополнительно можно добавить проверку, что пользователь обновляет свое мероприятие).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID мероприятия для обновления
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *                title:
 *                  type: string
 *                description:
 *                  type: string
 *                date:
 *                  type: string
 *                  format: date-time
 *                category:
 *                  type: string
 *                  enum: [concert, lecture, exhibition]
 *     responses:
 *       200:
 *         description: Мероприятие успешно обновлено
 *         # ... (content schema: $ref: '#/components/schemas/Event') ...
 *       400:
 *         description: Ошибка валидации данных
 *       401:
 *         description: Ошибка аутентификации
 *       403:
 *         description: Ошибка авторизации (пользователь не является создателем мероприятия - если реализовано)
 *       404:
 *         description: Мероприятие не найдено
 *       500:
 *         description: Ошибка сервера
 */
router.put("/:id", checkBlacklist, authenticateJwt, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const event = await Event.findByPk(eventId);

    if (!event) {
      return res.status(404).json({ message: "Мероприятие не найдено" });
    }

    if (event.createdBy !== userId) {
      return res
        .status(403)
        .json({
          message:
            "Доступ запрещен: вы не являетесь создателем этого мероприятия",
        });
    }

    const { title, description, date, category } = req.body;
    const updateData = { title, description, date, category };

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Нет данных для обновления" });
    }

    await event.update(updateData);
    res.status(200).json(event);
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err) => err.message);
      return res
        .status(400)
        .json({ message: `Ошибка валидации: ${messages.join(", ")}` });
    }
    console.error("Ошибка при обновлении мероприятия:", error);
    res
      .status(500)
      .json({ message: "Ошибка сервера при обновлении мероприятия" });
  }
});

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Удаление мероприятия (Защищено)
 *     tags: [Events]
 *     description: Удаляет мероприятие по ID. Требуется аутентификация. (Дополнительно можно добавить проверку, что пользователь удаляет свое мероприятие).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID мероприятия для удаления
 *     responses:
 *       204:
 *         description: Мероприятие успешно удалено (нет контента)
 *       401:
 *         description: Ошибка аутентификации
 *       403:
 *         description: Ошибка авторизации (пользователь не является создателем мероприятия - если реализовано)
 *       404:
 *         description: Мероприятие не найдено
 *       500:
 *         description: Ошибка сервера
 */
// Применяем authenticateJwt перед обработчиком
router.delete("/:id", checkBlacklist, authenticateJwt, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const event = await Event.findByPk(eventId);

    if (!event) {
      return res.status(404).json({ message: "Мероприятие не найдено" });
    }

    if (event.createdBy !== userId) {
      return res
        .status(403)
        .json({
          message:
            "Доступ запрещен: вы не являетесь создателем этого мероприятия",
        });
    }

    await event.destroy();
    res.status(204).end();
  } catch (error) {
    console.error("Ошибка при удалении мероприятия:", error);
    res
      .status(500)
      .json({ message: "Ошибка сервера при удалении мероприятия" });
  }
});

module.exports = router;
