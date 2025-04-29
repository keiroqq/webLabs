import type { FrontendUser } from '../types/user';

const AUTH_TOKEN_KEY = 'authToken';
const USER_INFO_KEY = 'userInfo';

/**
 * Сохраняет токен аутентификации в localStorage.
 * @param token - Токен для сохранения.
 */
export const saveToken = (token: string): void => {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Ошибка при сохранении токена в localStorage:', error);
  }
};

/**
 * Получает токен аутентификации из localStorage.
 * @returns Токен или null, если токен не найден.
 */
export const getToken = (): string | null => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Ошибка при получении токена из localStorage:', error);
    return null;
  }
};

/**
 * Удаляет токен аутентификации из localStorage.
 */
export const removeToken = (): void => {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Ошибка при удалении токена из localStorage:', error);
  }
};

/**
 * Сохраняет информацию о пользователе в localStorage.
 * @param user - Объект пользователя для сохранения.
 */
export const saveUserInfo = (user: FrontendUser): void => {
  try {
    if (!user) {
        console.warn("Попытка сохранить null или undefined пользователя.");
        return;
    }
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Ошибка при сохранении информации о пользователе в localStorage:', error);
  }
};

/**
 * Получает информацию о пользователе из localStorage.
 * @returns Объект пользователя или null, если информация не найдена или невалидна.
 */
export const getUserInfo = (): FrontendUser | null => {
  try {
    const userInfoString = localStorage.getItem(USER_INFO_KEY);
    if (!userInfoString) {
      return null;
    }
    try {
      const user = JSON.parse(userInfoString) as FrontendUser;
      if (user && typeof user === 'object' && user.id && user.name && user.email) {
          return user;
      } else {
          console.warn('Некорректная структура userInfo в localStorage:', user);
          removeUserInfo();
          return null;
      }
    } catch (parseError) {
       console.error('Ошибка парсинга userInfo из localStorage:', parseError);
       removeUserInfo();
       return null;
    }
  } catch (error) {
    console.error('Ошибка при получении информации о пользователе из localStorage:', error);
    return null;
  }
};

/**
 * Удаляет информацию о пользователе из localStorage.
 */
export const removeUserInfo = (): void => {
  try {
    localStorage.removeItem(USER_INFO_KEY);
  } catch (error) {
    console.error('Ошибка при удалении информации о пользователе из localStorage:', error);
  }
};


/**
 * Проверяет, аутентифицирован ли пользователь (наличие токена).
 * @returns true, если токен есть, иначе false.
 */
export const isAuthenticated = (): boolean => {
    return !!getToken();
};