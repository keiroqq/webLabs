import { Router, Request, Response, NextFunction, Handler } from 'express';
import {
  Op,
  WhereOptions,
  ValidationError,
  ValidationErrorItem,
  Attributes,
} from 'sequelize';
import passport from 'passport';
import dotenv from 'dotenv';
import path from 'path';

import Event, { EventAttributes } from '@models/event';
import checkBlacklist from '@middleware/checkBlacklist';
import '@config/passport.config';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const authenticateJwt: Handler = passport.authenticate('jwt', {
  session: false,
});
interface AuthenticatedUser {
  id: number;
}

const checkEventLimit = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as AuthenticatedUser | undefined;
    if (!user || typeof user.id !== 'number') {
      console.error(
        'Ошибка в checkEventLimit: req.user или req.user.id не найден после аутентификации.',
      );
      res.status(401).json({
        message: 'Пользователь не аутентифицирован (ошибка проверки лимита)',
      });
      return;
    }
    const userId = user.id;
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );
    const whereCondition: WhereOptions<Attributes<Event>> = {
      createdBy: userId,
      createdAt: { [Op.gte]: startOfDay, [Op.lt]: endOfDay },
    };
    const eventsCount = await Event.count({ where: whereCondition });
    const maxEventsPerDayStr = process.env.MAX_EVENTS_PER_DAY || '5';
    const maxEventsPerDay = parseInt(maxEventsPerDayStr, 10);
    if (isNaN(maxEventsPerDay)) {
      console.error(
        'Ошибка конфигурации: MAX_EVENTS_PER_DAY не является числом:',
        maxEventsPerDayStr,
      );
      res
        .status(500)
        .json({ message: 'Ошибка конфигурации сервера (лимит событий)' });
      return;
    }
    if (eventsCount >= maxEventsPerDay) {
      res.status(429).json({
        message: `Превышен лимит (${maxEventsPerDay}) создаваемых мероприятий в день`,
      });
      return;
    }
    next();
  } catch (error: unknown) {
    console.error('Ошибка при проверке лимита:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Ошибка сервера при проверке лимита' });
    }
  }
};

const router: Router = Router();

interface CreateEventBody {
  title?: string;
  description?: string | null;
  date?: string;
  category?: Attributes<Event>['category'];
}
interface UpdateEventBody {
  title?: string;
  description?: string | null;
  date?: string;
  category?: Attributes<Event>['category'];
}

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Получение списка всех мероприятий
 *     tags: [Events]
 *     description: Возвращает список всех мероприятий из базы данных. Можно фильтровать по категории.
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           $ref: '#/components/schemas/EventCategory'
 *         required: false
 *         description: Фильтрация мероприятий по категории
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
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const category = req.query.category as
      | Attributes<Event>['category']
      | undefined;
    const where: WhereOptions<Attributes<Event>> = {};
    if (category) {
      const validCategories: Attributes<Event>['category'][] = [
        'concert',
        'lecture',
        'exhibition',
      ];
      if (validCategories.includes(category)) {
        where.category = category;
      } else {
        res
          .status(400)
          .json({ message: `Недопустимая категория: ${category}` });
        return;
      }
    }
    const events: Event[] = await Event.findAll({ where });
    res.status(200).json(events);
  } catch (error: unknown) {
    console.error('Ошибка при получении мероприятий:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Ошибка сервера' });
    }
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
 *           type: integer
 *         description: Уникальный идентификатор (ID) мероприятия
 *     responses:
 *       200:
 *         description: Успешный ответ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: Мероприятие не найдено
 *       500:
 *         description: Ошибка сервера
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const eventId = parseInt(req.params.id, 10);
    if (isNaN(eventId)) {
      res.status(400).json({ message: 'Некорректный ID мероприятия' });
      return;
    }
    const event: Event | null = await Event.findByPk(eventId);
    if (event) {
      res.status(200).json(event);
    } else {
      res.status(404).json({ message: 'Мероприятие не найдено' });
    }
  } catch (error: unknown) {
    console.error('Ошибка при получении мероприятия:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  }
});

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Создание нового мероприятия (Защищено)
 *     tags: [Events]
 *     description: Создает новое мероприятие. Требуется аутентификация JWT. Проверяет дневной лимит.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEventInput'
 *     responses:
 *       201:
 *         description: Мероприятие успешно создано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Ошибка валидации данных (не указаны обязательные поля, неверный формат)
 *       401:
 *         description: Ошибка аутентификации
 *       429:
 *         description: Превышен лимит создаваемых мероприятий в день
 *       500:
 *         description: Ошибка сервера
 *
 * components:
 *   schemas:
 *     CreateEventInput:
 *       type: object
 *       required:
 *         - title
 *         - date
 *         - category
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         date:
 *           type: string
 *           format: date-time # Указываем, что ожидаем строку в формате даты-времени
 *         category:
 *           $ref: '#/components/schemas/EventCategory'
 */
router.post(
  '/',
  checkBlacklist,
  authenticateJwt,
  checkEventLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as AuthenticatedUser | undefined;
      if (!user || typeof user.id !== 'number') {
        res.status(401).json({
          message: 'Пользователь не аутентифицирован для создания события',
        });
        return;
      }
      const userId = user.id;
      const {
        title,
        description,
        date: dateString,
        category,
      } = req.body as CreateEventBody;
      if (!title || !dateString || !category) {
        res
          .status(400)
          .json({ message: 'Необходимо указать title, date и category' });
        return;
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        res.status(400).json({ message: 'Некорректный формат даты' });
        return;
      }
      const validCategories: Attributes<Event>['category'][] = [
        'concert',
        'lecture',
        'exhibition',
      ];
      if (!validCategories.includes(category)) {
        res
          .status(400)
          .json({ message: `Недопустимая категория: ${category}` });
        return;
      }
      const newEvent: Event = await Event.create({
        title,
        description: description ?? null,
        date,
        createdBy: userId,
        category,
      });
      res.status(201).json(newEvent);
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        const validationErrors = error.errors as ValidationErrorItem[];
        const messages = validationErrors.map((err) => err.message);
        res
          .status(400)
          .json({ message: `Ошибка валидации: ${messages.join(', ')}` });
        return;
      } else {
        console.error('Ошибка при создании мероприятия:', error);
        if (!res.headersSent) {
          res
            .status(500)
            .json({ message: 'Ошибка сервера при создании мероприятия' });
        }
      }
    }
  },
);

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Обновление мероприятия (Защищено)
 *     tags: [Events]
 *     description: Обновляет существующее мероприятие по ID. Требуется аутентификация. Обновлять может только создатель мероприятия.
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
 *             $ref: '#/components/schemas/UpdateEventInput'
 *     responses:
 *       200:
 *         description: Мероприятие успешно обновлено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Ошибка валидации данных или нет данных для обновления
 *       401:
 *         description: Ошибка аутентификации
 *       403:
 *         description: Доступ запрещен (пользователь не является создателем)
 *       404:
 *         description: Мероприятие не найдено
 *       500:
 *         description: Ошибка сервера
 *
 * components:
 *   schemas:
 *     UpdateEventInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         date:
 *           type: string
 *           format: date-time
 *         category:
 *           $ref: '#/components/schemas/EventCategory'
 */
router.put(
  '/:id',
  checkBlacklist,
  authenticateJwt,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) {
        res.status(400).json({ message: 'Некорректный ID мероприятия' });
        return;
      }
      const user = req.user as AuthenticatedUser | undefined;
      if (!user || typeof user.id !== 'number') {
        res.status(401).json({
          message: 'Пользователь не аутентифицирован для обновления события',
        });
        return;
      }
      const userId = user.id;
      const event: Event | null = await Event.findByPk(eventId);
      if (!event) {
        res.status(404).json({ message: 'Мероприятие не найдено' });
        return;
      }
      if (event.createdBy !== userId) {
        res.status(403).json({
          message:
            'Доступ запрещен: вы не являетесь создателем этого мероприятия',
        });
        return;
      }
      const {
        title,
        description,
        date: dateString,
        category,
      } = req.body as UpdateEventBody;
      const updateData: Partial<EventAttributes> = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) {
        const validCategories: Attributes<Event>['category'][] = [
          'concert',
          'lecture',
          'exhibition',
        ];
        if (validCategories.includes(category)) {
          updateData.category = category;
        } else {
          res
            .status(400)
            .json({ message: `Недопустимая категория: ${category}` });
          return;
        }
      }
      if (dateString !== undefined) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          res.status(400).json({ message: 'Некорректный формат даты' });
          return;
        }
        updateData.date = date;
      }
      if (Object.keys(updateData).length === 0) {
        res.status(400).json({ message: 'Нет данных для обновления' });
        return;
      }
      await event.update(updateData);
      res.status(200).json(event);
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        const validationErrors = error.errors as ValidationErrorItem[];
        const messages = validationErrors.map((err) => err.message);
        res
          .status(400)
          .json({ message: `Ошибка валидации: ${messages.join(', ')}` });
        return;
      } else {
        console.error('Ошибка при обновлении мероприятия:', error);
        if (!res.headersSent) {
          res
            .status(500)
            .json({ message: 'Ошибка сервера при обновлении мероприятия' });
        }
      }
    }
  },
);

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Удаление мероприятия (Защищено)
 *     tags: [Events]
 *     description: Удаляет мероприятие по ID. Требуется аутентификация JWT. Удалять может только создатель мероприятия.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *           example: 1
 *         description: Уникальный идентификатор (ID) мероприятия для удаления
 *     responses:
 *       '204':
 *         description: Мероприятие успешно удалено (Нет контента)
 *       '400':
 *         description: Некорректный ID мероприятия (не является числом)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Некорректный ID мероприятия"
 *       '401':
 *         description: Ошибка аутентификации (например, невалидный или просроченный токен, токен в черном списке)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized | Доступ запрещен: токен аннулирован..."
 *       '403':
 *         description: Доступ запрещен (пользователь не является создателем мероприятия)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Доступ запрещен: вы не являетесь создателем этого мероприятия"
 *       '404':
 *         description: Мероприятие не найдено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Мероприятие не найдено"
 *       '500':
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ошибка сервера при удалении мероприятия"
 */
router.delete(
  '/:id',
  checkBlacklist,
  authenticateJwt,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) {
        res.status(400).json({ message: 'Некорректный ID мероприятия' });
        return;
      }
      const user = req.user as AuthenticatedUser | undefined;
      if (!user || typeof user.id !== 'number') {
        res.status(401).json({
          message: 'Пользователь не аутентифицирован для удаления события',
        });
        return;
      }
      const userId = user.id;
      const event: Event | null = await Event.findByPk(eventId);
      if (!event) {
        res.status(404).json({ message: 'Мероприятие не найдено' });
        return;
      }
      if (event.createdBy !== userId) {
        res.status(403).json({
          message:
            'Доступ запрещен: вы не являетесь создателем этого мероприятия',
        });
        return;
      }
      await event.destroy();
      res.status(204).end();
    } catch (error: unknown) {
      console.error('Ошибка при удалении мероприятия:', error);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ message: 'Ошибка сервера при удалении мероприятия' });
      }
    }
  },
);

export default router;
