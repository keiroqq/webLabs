// src/config/swagger.ts
import swaggerJsdoc, { Options } from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import path from 'path';

const rootDir = path.resolve(__dirname, '../..');
const PORT = process.env.PORT || 3000;

const swaggerOptions: Options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Management API Documentation (TypeScript)',
      version: '1.0.0',
      description:
        'API для управления пользователями и мероприятиями с аутентификацией JWT.',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Введите JWT токен в формате **Bearer {токен}**',
        },
      },
      schemas: {
        Event: {
          type: 'object',
          required: ['id', 'title', 'date', 'category', 'createdBy'],
          properties: {
            id: {
              type: 'integer',
              description: 'Уникальный идентификатор мероприятия',
              example: 1,
            },
            title: {
              type: 'string',
              description: 'Название мероприятия',
              example: 'Концерт группы "The Rockers"',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Описание мероприятия',
              example: 'Грандиозное возвращение легенд рока!',
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'Дата и время проведения мероприятия',
              example: '2024-08-15T20:00:00Z',
            },
            createdBy: {
              type: 'integer',
              description: 'ID пользователя, создавшего мероприятие',
              example: 1,
            },
            category: {
              $ref: '#/components/schemas/EventCategory',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания записи о мероприятии',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата последнего обновления записи о мероприятии',
            },
            participantsCount: {
              type: 'integer',
              description: 'Количество зарегистрированных участников',
              example: 15,
            },
            isCurrentUserParticipant: {
              type: 'boolean',
              description:
                'Зарегистрирован ли текущий аутентифицированный пользователь на это мероприятие',
              example: false,
            },
          },
        },
        EventCategory: {
          type: 'string',
          enum: ['concert', 'lecture', 'exhibition'],
          description: 'Категория мероприятия',
          example: 'concert',
        },
        User: {
          type: 'object',
          required: ['id', 'name', 'email'],
          properties: {
            id: {
              type: 'integer',
              description: 'Уникальный идентификатор пользователя',
              example: 1,
            },
            name: {
              type: 'string',
              description: 'Имя пользователя',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email пользователя (уникальный)',
              example: 'john.doe@example.com',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата регистрации пользователя',
            },
          },
        },
        UserRegistrationInput: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'Jane Doe' },
            email: {
              type: 'string',
              format: 'email',
              example: 'jane.doe@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'Минимум 6 символов',
              example: 'password123',
            },
          },
        },
        UserLoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'jane.doe@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'password123',
            },
          },
        },
        CreateEventInput: {
          type: 'object',
          required: ['title', 'date', 'category'],
          properties: {
            title: { type: 'string', example: 'Лекция по Frontend' },
            description: {
              type: 'string',
              nullable: true,
              example: 'Обсудим новые тренды React и Vue.',
            },
            date: {
              type: 'string',
              format: 'date-time',
              example: '2024-09-01T15:00:00Z',
            },
            category: { $ref: '#/components/schemas/EventCategory' },
          },
        },
        UpdateEventInput: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            date: { type: 'string', format: 'date-time' },
            category: { $ref: '#/components/schemas/EventCategory' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Сообщение об ошибке' },
            details: {
              type: 'string',
              description: 'Дополнительные детали (опционально)',
            },
          },
        },
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Локальный сервер разработки',
      },
    ],
  },
  apis: [
    path.join(rootDir, './src/routes/*.ts'),
    path.join(rootDir, './src/models/*.ts'),
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const setupSwagger = (app: Application): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(
    `Swagger документация доступна по адресу http://localhost:${PORT}/api-docs`,
  );
};

export default setupSwagger;
