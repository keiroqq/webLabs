import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import passport from './config/passport.config.js';

import sequelize from './config/db.js';
import eventRoutes from './routes/events.js';
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js';
import setupSwagger from './config/swagger.js';

import Event from './models/event.js';
import User from './models/user.js';
import './models/blacklistedToken.js';
dotenv.config();

const app: Application = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(cors());
app.use(passport.initialize());

const portStr = process.env.PORT || '3000';
const port = parseInt(portStr, 10);

if (isNaN(port)) {
  console.error(`Ошибка: Неверный порт указан в PORT: ${portStr}`);
  process.exit(1);
}

setupSwagger(app);

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/events', eventRoutes);

User.hasMany(Event, { foreignKey: 'createdBy', as: 'createdEvents' });
Event.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

(async () => {
  try {
    await sequelize.sync({ force: false }); // force: false/true
    console.log('База данных синхронизирована.');
    await sequelize.authenticate();
    console.log('Подключение к базе данных успешно установлено.');

    app.listen(port, () => {
      console.log(`Сервер запущен на порту ${port}`);
    });
  } catch (err: unknown) {
    console.error('Ошибка при инициализации приложения:', err);
    process.exit(1);
  }
})();
