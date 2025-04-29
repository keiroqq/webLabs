import swaggerJsdoc, { Options } from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const PORT = process.env.PORT || 3000;

const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Management API Documentation (TypeScript)',
      version: '1.0.0',
      description:
        'API для управления пользователями и мероприятиями с аутентификацией JWT (Переведено на TypeScript).',
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
