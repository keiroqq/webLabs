import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  console.error(
    'VITE_API_BASE_URL не определена в .env! Укажите базовый URL API.'
  );
  throw new Error('VITE_API_BASE_URL is not defined');
}

const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 5000
});

// Интерцептор запросов
// apiClient.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('authToken'); // Или из утилиты storage
//     if (token && config.headers) {
//       config.headers['Authorization'] = token; // Используем токен из localStorage
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// Интерцептор ответов
// apiClient.interceptors.response.use(
//   (response) => {
//     // Все статусы 2xx попадают сюда
//     return response;
//   },
//   (error) => {
//     // Статусы не из диапазона 2xx попадают сюда
//     if (axios.isAxiosError(error)) {
//         console.error('Axios error:', error.response?.status, error.response?.data);
//         // Можно добавить обработку 401 (Unauthorized) для автоматического разлогина
//         if (error.response?.status === 401) {
//            console.log('Unauthorized, logging out...');
//            // Здесь можно вызвать функцию для очистки localStorage и редиректа
//            // logoutUserLocally(); // Условная функция
//         }
//     } else {
//         console.error('Unexpected error:', error);
//     }
//     return Promise.reject(error); // Важно пробросить ошибку дальше
//   }
// );

export default apiClient;