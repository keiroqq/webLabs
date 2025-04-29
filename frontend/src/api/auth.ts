import { LoginResponse } from '../types/user';
import apiClient from './axios';
import axios from 'axios';

interface LoginCredentials {
  email?: string;
  password?: string;
}

interface RegisterCredentials {
  name?: string;
  email?: string;
  password?: string;
}

export const registerUser = async (
  credentials: RegisterCredentials,
): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post<{ message: string }>(
      '/auth/register',
      credentials,
    );
    return response.data;
  } catch (error) {
    console.error('Ошибка при регистрации (axios):', error);
    let errorMessage = 'Произошла неизвестная ошибка при регистрации.';
    if (axios.isAxiosError(error)) {
      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          `Ошибка ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'Не удалось подключиться к серверу.';
      } else {
        errorMessage = `Ошибка настройки запроса: ${error.message}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};

export const loginUser = async (
  credentials: LoginCredentials,
): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>(
      '/auth/login',
      credentials,
    );

    if (!response.data || !response.data.token || !response.data.user) {
      console.error(
        'Неверная структура ответа при входе (axios):',
        response.data,
      );
      throw new Error('Некорректный ответ от сервера при входе.');
    }
    return response.data;
  } catch (error) {
    console.error('Ошибка при входе (axios):', error);
    let errorMessage = 'Произошла неизвестная ошибка при входе.';
    if (axios.isAxiosError(error)) {
      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          `Ошибка ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'Не удалось подключиться к серверу.';
      } else {
        errorMessage = `Ошибка настройки запроса: ${error.message}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};

export const logoutUser = async (token: string | null): Promise<void> => {
  if (!token) {
    console.warn('Попытка выхода без токена.');
    return;
  }
  const actualToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

  try {
    await apiClient.post(
      '/auth/logout',
      {},
      {
        headers: {
          Authorization: `Bearer ${actualToken}`,
        },
      },
    );
  } catch (error) {
    console.error('Ошибка при выходе (axios):', error);
    let shouldThrow = true;

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        console.warn(
          'Logout API вернул 401 (токен невалиден/аннулирован). Игнорируем ошибку.',
        );
        shouldThrow = false;
      } else if (error.response) {
        const serverMessage =
          error.response.data?.message || error.response.statusText;
        console.error(
          `Ошибка при выходе, статус ${error.response.status}: ${serverMessage}`,
        );
      } else if (error.request) {
        console.error('Ошибка при выходе: нет ответа от сервера');
      }
    }

    if (shouldThrow) {
      throw new Error('Не удалось выполнить выход на сервере.');
    }
  }
};
