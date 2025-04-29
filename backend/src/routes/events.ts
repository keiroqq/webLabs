import {
  Router,
  Request,
  Response,
  NextFunction,
  Handler,
  RequestHandler,
} from 'express';
import {
  Op,
  ValidationError,
  ValidationErrorItem,
  fn,
  col,
  WhereOptions,
  Attributes,
} from 'sequelize';
import passport from 'passport';
import dotenv from 'dotenv';
import path from 'path';

import Event, { EventAttributes } from '@models/event';
import User from '@models/user';
import EventParticipant from '@models/eventParticipant';
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

interface EventParticipantCount {
  eventId: number;
  participantsCount: string;
}

interface UserParticipation {
  eventId: number;
}

const addParticipationInfo = async (
  events: Event[],
  currentUserId?: number,
): Promise<EventAttributes[]> => {
  const eventIds = events.map((e) => e.id);
  if (eventIds.length === 0) return events.map((e) => e.get({ plain: true }));

  const counts = (await EventParticipant.findAll({
    attributes: ['eventId', [fn('COUNT', col('userId')), 'participantsCount']],
    where: { eventId: eventIds },
    group: ['eventId'],
    raw: true,
  })) as unknown as EventParticipantCount[];
  const countsMap = new Map(
    counts.map((c) => [c.eventId, parseInt(c.participantsCount, 10)]),
  );

  let participationMap = new Map<number, boolean>();
  if (currentUserId) {
    const participations = (await EventParticipant.findAll({
      where: {
        userId: currentUserId,
        eventId: eventIds,
      },
      attributes: ['eventId'],
      raw: true,
    })) as unknown as UserParticipation[];
    participationMap = new Map(participations.map((p) => [p.eventId, true]));
  }

  return events.map((event) => {
    const eventPlain = event.get({ plain: true });
    return {
      ...eventPlain,
      participantsCount: countsMap.get(event.id) || 0,
      isCurrentUserParticipant: currentUserId
        ? participationMap.get(event.id) || false
        : false,
    };
  });
};

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
router.get('/', (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate(
    'jwt',
    { session: false },
    async (err: Error | null, user: User | false | null) => {
      if (err) {
        console.error('Ошибка аутентификации в GET /events:', err);
      }
      const currentUserId = user ? user.id : undefined;

      try {
        const category = req.query.category as
          | EventAttributes['category']
          | undefined;
        const where: WhereOptions<EventAttributes> = {};
        if (category) {
          if (['concert', 'lecture', 'exhibition'].includes(category)) {
            where.category = category;
          } else {
            res
              .status(400)
              .json({ message: `Недопустимая категория: ${category}` });
            return;
          }
        }

        const events = await Event.findAll({ where, order: [['date', 'ASC']] });
        const eventsWithInfo = await addParticipationInfo(
          events,
          currentUserId,
        );

        res.status(200).json(eventsWithInfo);
      } catch (error: unknown) {
        console.error('Ошибка при получении мероприятий:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Ошибка сервера' });
        }
      }
    },
  )(req, res, next);
});

/**
 * @swagger
 * /events/my:
 *   get:
 *     summary: Получение списка мероприятий, созданных текущим пользователем
 *     tags: [Events]
 *     description: Возвращает массив мероприятий, где поле createdBy соответствует ID аутентифицированного пользователя.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Успешный ответ со списком мероприятий пользователя.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       401:
 *         description: Ошибка аутентификации.
 *       500:
 *         description: Внутренняя ошибка сервера.
 */
router.get(
  '/my',
  [checkBlacklist as RequestHandler, authenticateJwt as RequestHandler],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User | undefined;
      if (!user || typeof user.id !== 'number') {
        res.status(401).json({ message: 'Пользователь не аутентифицирован' });
        return;
      }
      const userId = user.id;
      const userEvents = await Event.findAll({
        where: { createdBy: userId },
        order: [['date', 'ASC']],
      });
      const eventsWithInfo = await addParticipationInfo(userEvents, userId);
      res.status(200).json(eventsWithInfo);
    } catch (error: unknown) {
      console.error('Ошибка при получении мероприятий пользователя:', error);
      if (!res.headersSent) {
        res.status(500).json({
          message: 'Ошибка сервера при получении мероприятий пользователя',
        });
      }
    }
  },
);

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
router.get('/:id', (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate(
    'jwt',
    { session: false },
    async (err: Error | null, user: User | false | null) => {
      if (err) {
        console.error('Ошибка аутентификации в GET /events/:id:', err);
      }
      const currentUserId = user ? user.id : undefined;

      try {
        const eventId = parseInt(req.params.id, 10);
        if (isNaN(eventId)) {
          res.status(400).json({ message: 'Некорректный ID мероприятия' });
          return;
        }
        const event = await Event.findByPk(eventId);
        if (!event) {
          res.status(404).json({ message: 'Мероприятие не найдено' });
          return;
        }
        const eventsWithInfo = await addParticipationInfo(
          [event],
          currentUserId,
        );
        res.status(200).json(eventsWithInfo[0]);
      } catch (error: unknown) {
        console.error('Ошибка при получении мероприятия:', error);
        if (!res.headersSent) {
          res
            .status(500)
            .json({ message: 'Ошибка сервера при получении мероприятия' });
        }
      }
    },
  )(req, res, next);
});

/**
 * @swagger
 * /events/{eventId}/participants:
 *   get:
 *     summary: Получение списка участников мероприятия
 *     tags: [Events]
 *     description: Возвращает массив пользователей (только id, name, email), зарегистрированных на указанное мероприятие.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID мероприятия, для которого нужно получить список участников
 *     responses:
 *       200:
 *         description: Успешный ответ со списком участников.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       400:
 *         description: Некорректный ID мероприятия.
 *       401:
 *         description: Ошибка аутентификации (если эндпоинт защищен).
 *       404:
 *         description: Мероприятие не найдено.
 *       500:
 *         description: Внутренняя ошибка сервера.
 */
router.get(
  '/:eventId/participants',
  [checkBlacklist as RequestHandler, authenticateJwt as RequestHandler],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      if (isNaN(eventId)) {
        res.status(400).json({ message: 'Некорректный ID мероприятия' });
        return;
      }
      const eventExists = await Event.findByPk(eventId, { attributes: ['id'] });
      if (!eventExists) {
        res.status(404).json({ message: 'Мероприятие не найдено' });
        return;
      }

      const participants = await User.findAll({
        attributes: ['id', 'name', 'email'],
        include: [
          {
            model: EventParticipant,
            attributes: [],
            where: { eventId: eventId },
            required: true,
          },
        ],
        order: [['name', 'ASC']],
      });
      res.status(200).json(participants || []);
    } catch (error: unknown) {
      console.error(
        `Ошибка при получении участников для события ID ${req.params.eventId}:`,
        error,
      );
      if (!res.headersSent) {
        res
          .status(500)
          .json({ message: 'Ошибка сервера при получении списка участников' });
      }
    }
  },
);

/**
 * @swagger
 * /events/{eventId}/register:
 *   post:
 *     summary: Зарегистрировать текущего пользователя на мероприятие
 *     tags: [Events]
 *     description: Регистрирует аутентифицированного пользователя как участника указанного мероприятия. Нельзя зарегистрироваться на свое мероприятие.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID мероприятия для регистрации
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован на мероприятие
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventWithParticipation'
 *       400:
 *         description: Некорректный ID мероприятия или пользователь уже зарегистрирован
 *       401:
 *         description: Пользователь не аутентифицирован
 *       403:
 *         description: Нельзя зарегистрироваться на собственное мероприятие
 *       404:
 *         description: Мероприятие не найдено
 *       409:
 *         description: Пользователь уже зарегистрирован на это мероприятие (Конфликт)
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post(
  '/:eventId/register',
  [checkBlacklist as RequestHandler, authenticateJwt as RequestHandler],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User | undefined;
      if (!user) {
        res.status(401).json({ message: 'Не авторизован' });
        return;
      }
      const userId = user.id;
      const eventId = parseInt(req.params.eventId, 10);
      if (isNaN(eventId)) {
        res.status(400).json({ message: 'Некорректный ID мероприятия' });
        return;
      }
      const event = await Event.findByPk(eventId);
      if (!event) {
        res.status(404).json({ message: 'Мероприятие не найдено' });
        return;
      }
      if (event.createdBy === userId) {
        res.status(403).json({
          message: 'Нельзя зарегистрироваться на собственное мероприятие',
        });
        return;
      }
      const existingParticipation = await EventParticipant.findOne({
        where: { userId, eventId },
      });
      if (existingParticipation) {
        res
          .status(409)
          .json({ message: 'Вы уже зарегистрированы на это мероприятие' });
        return;
      }
      await EventParticipant.create({ userId, eventId });
      const updatedEvents = await addParticipationInfo([event], userId);
      res.status(201).json(updatedEvents[0]);
    } catch (error: unknown) {
      console.error('Ошибка при регистрации на мероприятие:', error);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ message: 'Ошибка сервера при регистрации на мероприятие' });
      }
    }
  },
);

/**
 * @swagger
 * /events/{eventId}/register:
 *   delete:
 *     summary: Отменить регистрацию текущего пользователя на мероприятие
 *     tags: [Events]
 *     description: Отменяет регистрацию аутентифицированного пользователя на указанное мероприятие.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID мероприятия для отмены регистрации
 *     responses:
 *       200:
 *         description: Регистрация успешно отменена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventWithParticipation'
 *       400:
 *         description: Некорректный ID мероприятия
 *       401:
 *         description: Пользователь не аутентифицирован
 *       404:
 *         description: Мероприятие не найдено или пользователь не был на него зарегистрирован
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.delete(
  '/:eventId/register',
  [checkBlacklist as RequestHandler, authenticateJwt as RequestHandler],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User | undefined;
      if (!user) {
        res.status(401).json({ message: 'Не авторизован' });
        return;
      }
      const userId = user.id;
      const eventId = parseInt(req.params.eventId, 10);
      if (isNaN(eventId)) {
        res.status(400).json({ message: 'Некорректный ID мероприятия' });
        return;
      }
      const event = await Event.findByPk(eventId);
      if (!event) {
        res.status(404).json({ message: 'Мероприятие не найдено' });
        return;
      }
      const participation = await EventParticipant.findOne({
        where: { userId, eventId },
      });
      if (!participation) {
        res
          .status(404)
          .json({ message: 'Вы не были зарегистрированы на это мероприятие' });
        return;
      }
      await participation.destroy();
      const updatedEvents = await addParticipationInfo([event], userId);
      res.status(200).json(updatedEvents[0]);
    } catch (error: unknown) {
      console.error('Ошибка при отмене регистрации:', error);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ message: 'Ошибка сервера при отмене регистрации' });
      }
    }
  },
);

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
