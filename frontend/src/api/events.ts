import type { FrontendEvent, EventCategory } from '../types/event';
import apiClient from './axios';
import axios from 'axios';

export const fetchEvents = async (
  category?: EventCategory | null,
): Promise<FrontendEvent[]> => {
  try {
    let url = '/events';
    if (category) {
      const params = new URLSearchParams();
      params.append('category', category);
      url += `?${params.toString()}`;
      console.log(`Fetching events with category: ${category}, URL: ${url}`);
    } else {
      console.log(`Fetching all events, URL: ${url}`);
    }

    const response = await apiClient.get<FrontendEvent[]>(url);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении мероприятий (axios):', error);
    let errorMessage = 'Произошла неизвестная ошибка при загрузке мероприятий';
    if (axios.isAxiosError(error)) {
      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          `Ошибка ${error.response.status}: ${error.response.statusText}`;
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
