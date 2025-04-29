import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';

import passport from '@config/passport.config';
import sequelize from '@config/db';
import eventRoutes from '@routes/events';
import userRoutes from '@routes/users';
import authRoutes from '@routes/auth';
import setupSwagger from '@config/swagger';
import Event from '@models/event';
import User from '@models/user';
import '@models/blacklistedToken';
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
