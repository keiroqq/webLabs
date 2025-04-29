import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptions,
  VerifiedCallback,
} from 'passport-jwt';
import passport from 'passport';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/user.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error(
    'Критическая ошибка: JWT_SECRET не определен в переменных окружения!',
  );
  process.exit(1);
}

interface JwtPayload {
  id: number;
  iat?: number;
  exp?: number;
}

const options: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret,
};

passport.use(
  new JwtStrategy(
    options,
    async (payload: JwtPayload, done: VerifiedCallback): Promise<void> => {
      try {
        const user = await User.findByPk(payload.id, {
          attributes: { exclude: ['password'] },
        });

        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (error: unknown) {
        console.error('Ошибка при поиске пользователя в JWT стратегии:', error);
        if (error instanceof Error) {
          return done(error);
        } else {
          return done(new Error(String(error || 'Unknown passport error')));
        }
      }
    },
  ),
);

export default passport;
