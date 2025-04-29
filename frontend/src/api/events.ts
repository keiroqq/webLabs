import type { FrontendEvent } from '../types/event';
import apiClient from './axios';
import axios from 'axios';

export const fetchEvents = async (): Promise<FrontendEvent[]> => {
  try {
    const response = await apiClient.get<FrontendEvent[]>('/events');

    return response.data;

  } catch (error) {
    console.error('Ошибка при получении мероприятий (axios):', error);

    let errorMessage = 'Произошла неизвестная ошибка при загрузке мероприятий';
    if (axios.isAxiosError(error)) {
      if (error.response) {
        errorMessage = error.response.data?.message || `Ошибка ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'Не удалось подключиться к серверу. Проверьте сеть.';
      } else {
        errorMessage = `Ошибка настройки запроса: ${error.message}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};