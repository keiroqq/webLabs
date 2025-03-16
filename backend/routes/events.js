const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const express = require("express");
const router = express.Router();
const Event = require("../models/event"); // Импортируем модель Event
const User = require("../models/user");
const { Op } = require("sequelize"); // Импортируем Op

const checkEventLimit = async (req, res, next) => {
  try {
    const userId = req.body.createdBy; // Получаем ID пользователя из тела запроса

    // Проверяем, передан ли ID пользователя
    if (!userId) {
      return res.status(400).json({ message: "Не указан ID пользователя" });
    }

    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ); // Начало сегодняшнего дня
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    ); // Начало следующего дня

    // Считаем количество событий, созданных пользователем за последние 24 часа
    const eventsCount = await Event.count({
      where: {
        createdBy: userId,
        createdAt: {
          [Op.gte]: startOfDay, // Больше или равно начала сегодняшнего дня
          [Op.lt]: endOfDay, // Меньше начала следующего дня
        },
      },
    });

    const maxEventsPerDay = parseInt(process.env.MAX_EVENTS_PER_DAY); // Получаем лимит из .env

    // Проверяем, не превышен ли лимит
    if (eventsCount >= maxEventsPerDay) {
      return res.status(429).json({
        message: `Превышен лимит (${maxEventsPerDay}) создаваемых мероприятий в день`,
      }); // HTTP 429 Too Many Requests
    }

    // Если лимит не превышен, передаем управление следующему middleware или роуту
    next();
  } catch (error) {
    console.error("Ошибка при проверке лимита:", error);
    res.status(500).json({ message: "Ошибка сервера" });
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
    const { category } = req.query; // Получаем категорию из query parameters

    let where = {}; // Создаем объект для условий фильтрации

    if (category) {
      where.category = { [Op.eq]: category }; // Добавляем условие для фильтрации по категории
    }

    const events = await Event.findAll({
      where: where, // Передаем условия фильтрации в метод findAll
    });

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
 *     summary: Получение мероприятия по ID
 *     description: Возвращает мероприятие по указанному ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID мероприятия
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
 *     summary: Создание нового мероприятия
 *     description: Создает новое мероприятие в базе данных
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201:
 *         description: Мероприятие успешно создано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: Пользователь не найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Пользователь с указанным ID не существует"
 *       500:
 *         description: Ошибка сервера
 */
router.post("/", checkEventLimit, async (req, res) => {
  try {
    const { title, description, date, createdBy, category } = req.body;

    // Проверяем существование пользователя
    const user = await User.findByPk(createdBy);
    if (!user) {
      return res
        .status(404)
        .json({ message: "Пользователь с указанным ID не существует" });
    }

    // Создание мероприятия
    const newEvent = await Event.create({
      title,
      description,
      date,
      createdBy,
      category,
    });
    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Ошибка при создании мероприятия:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Обновление мероприятия
 *     description: Обновляет существующее мероприятие по указанному ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID мероприятия
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       200:
 *         description: Мероприятие успешно обновлено
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
router.put("/:id", async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (event) {
      await event.update(req.body);
      res.status(200).json(event);
    } else {
      res.status(404).json({ message: "Мероприятие не найдено" });
    }
  } catch (error) {
    console.error("Ошибка при обновлении мероприятия:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Удаление мероприятия
 *     description: Удаляет мероприятие по указанному ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID мероприятия
 *     responses:
 *       204:
 *         description: Мероприятие успешно удалено
 *       404:
 *         description: Мероприятие не найдено
 *       500:
 *         description: Ошибка сервера
 */
router.delete("/:id", async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (event) {
      await event.destroy();
      res.status(204).end(); // 204 No Content - успешное удаление, нет контента для ответа
    } else {
      res.status(404).json({ message: "Мероприятие не найдено" });
    }
  } catch (error) {
    console.error("Ошибка при удалении мероприятия:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// Здесь будут наши маршруты
module.exports = router;
