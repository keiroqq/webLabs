import type { FrontendEvent, EventCategory, EventCreationData } from '../types/event';
import apiClient from './axios';
import axios from 'axios';

export type EventFormData = EventCreationData;

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

export const fetchUserEvents = async (): Promise<FrontendEvent[]> => {
  console.log("Attempting to fetch user's events...");
  try {
      const response = await apiClient.get<FrontendEvent[]>('/events/my');
      console.log("User events fetched successfully:", response.data);
      return response.data;
  } catch (error) {
      console.error('Ошибка при получении мероприятий пользователя (axios):', error);
      let errorMessage = 'Произошла неизвестная ошибка при загрузке ваших мероприятий';
      if (axios.isAxiosError(error)) {
          if (error.response) {
              errorMessage = error.response.data?.message || `Ошибка ${error.response.status}: ${error.response.statusText}`;
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

export const fetchEventById = async (id: string | number): Promise<FrontendEvent> => {
  console.log(`Attempting to fetch event by ID: ${id}`);
  try {
      const response = await apiClient.get<FrontendEvent>(`/events/${id}`);
      return response.data;
  } catch (error) {
      console.error(`Ошибка при получении события ID ${id} (axios):`, error);
      let errorMessage = 'Произошла неизвестная ошибка при загрузке события';
      if (axios.isAxiosError(error)) { if (error.response) { errorMessage = error.response.data?.message || `Ошибка ${error.response.status}: ${error.response.statusText}`; } else if (error.request) { errorMessage = 'Не удалось подключиться к серверу.'; } else { errorMessage = `Ошибка настройки запроса: ${error.message}`; } } else if (error instanceof Error) { errorMessage = error.message; }
      throw new Error(errorMessage);
  }
};

export const createEvent = async (eventData: EventFormData): Promise<FrontendEvent> => {
  console.log("Attempting to create event:", eventData);
  try {
      const response = await apiClient.post<FrontendEvent>('/events', eventData);
      console.log("Event created successfully:", response.data);
      return response.data;
  } catch (error) {
      console.error('Ошибка при создании события (axios):', error);
      let errorMessage = 'Произошла неизвестная ошибка при создании события';
      if (axios.isAxiosError(error)) { if (error.response) { errorMessage = error.response.data?.message || `Ошибка ${error.response.status}: ${error.response.statusText}`; } else if (error.request) { errorMessage = 'Не удалось подключиться к серверу.'; } else { errorMessage = `Ошибка настройки запроса: ${error.message}`; } } else if (error instanceof Error) { errorMessage = error.message; }
      throw new Error(errorMessage);
  }
};

export const updateEvent = async (id: string | number, eventData: Partial<EventFormData>): Promise<FrontendEvent> => {
  console.log(`Attempting to update event ID ${id}:`, eventData);
 try {
     const response = await apiClient.put<FrontendEvent>(`/events/${id}`, eventData);
      console.log("Event updated successfully:", response.data);
     return response.data;
  } catch (error) {
      console.error(`Ошибка при обновлении события ID ${id} (axios):`, error);
      let errorMessage = 'Произошла неизвестная ошибка при обновлении события';
      if (axios.isAxiosError(error)) { if (error.response) { errorMessage = error.response.data?.message || `Ошибка ${error.response.status}: ${error.response.statusText}`; } else if (error.request) { errorMessage = 'Не удалось подключиться к серверу.'; } else { errorMessage = `Ошибка настройки запроса: ${error.message}`; } } else if (error instanceof Error) { errorMessage = error.message; }
      throw new Error(errorMessage);
  }
};

export const deleteEvent = async (id: string | number): Promise<void> => {
  console.log(`Attempting to delete event ID ${id}`);
  try {
      await apiClient.delete(`/events/${id}`);
      console.log("Event deleted successfully");
  } catch (error) {
      console.error(`Ошибка при удалении события ID ${id} (axios):`, error);
      let errorMessage = 'Произошла неизвестная ошибка при удалении события';
       if (axios.isAxiosError(error)) { if (error.response) { errorMessage = error.response.data?.message || `Ошибка ${error.response.status}: ${error.response.statusText}`; } else if (error.request) { errorMessage = 'Не удалось подключиться к серверу.'; } else { errorMessage = `Ошибка настройки запроса: ${error.message}`; } } else if (error instanceof Error) { errorMessage = error.message; }
      throw new Error(errorMessage);
  }
};