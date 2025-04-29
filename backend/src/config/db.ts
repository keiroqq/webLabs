import { Sequelize } from 'sequelize';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST;
const DB_PORT_STR = process.env.DB_PORT;
const DB_DIALECT = process.env.DB_DIALECT || 'postgres';

if (!DB_NAME || !DB_USER || !DB_PASSWORD || !DB_HOST || !DB_PORT_STR) {
  console.error(
    'Ошибка: Не все переменные окружения базы данных определены в .env файле (DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT).',
  );
  process.exit(1);
}

const DB_PORT = parseInt(DB_PORT_STR, 10);
if (isNaN(DB_PORT)) {
  console.error('Ошибка: DB_PORT должен быть числом.');
  process.exit(1);
}

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DIALECT as 'postgres' | 'mysql' | 'sqlite' | 'mariadb' | 'mssql',
  logging: false,
});

export async function testConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('Соединение с базой данных успешно установлено.');
  } catch (error: unknown) {
    console.error('Не удалось подключиться к базе данных:', error);
    if (error instanceof Error) {
      console.error('Детали ошибки:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    process.exit(1);
  }
}

export default sequelize;
