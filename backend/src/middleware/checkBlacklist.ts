import { Request, Response, NextFunction } from 'express';
import BlacklistedToken from '@models/blacklistedToken';

const checkBlacklist = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.warn(
      'Не удалось извлечь токен из заголовка Authorization:',
      authHeader,
    );
    res.status(401).json({ message: 'Некорректный формат токена' });
    return;
  }

  try {
    const blacklisted = await BlacklistedToken.findOne({
      where: { token: token },
    });

    if (blacklisted) {
      res.status(401).json({
        message: 'Доступ запрещен: токен аннулирован (в черном списке)',
      });
      return;
    }
    next();
  } catch (error: unknown) {
    console.error('Ошибка при проверке черного списка токенов:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Ошибка сервера при проверке токена' });
      return;
    }
  }
};

export default checkBlacklist;
