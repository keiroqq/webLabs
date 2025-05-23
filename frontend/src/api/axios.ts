import axios, { AxiosError } from 'axios';
import { getToken, removeToken, removeUserInfo } from '../utils/storage';
import { store } from '../app/store';
import { logout } from '../features/auth/authSlice';

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  console.error(
    'VITE_API_BASE_URL не определена в .env! Укажите базовый URL API.',
  );
  throw new Error('VITE_API_BASE_URL is not defined');
}

const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 5000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers['Authorization'] = token;
    }
    return config;
  },
  (error) => {
    console.error('Axios request interceptor error:', error);
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError | Error) => {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Axios error response:', error.response.status, error.response.data, 'for URL:', error.config?.url);

      const originalRequestUrl = error.config?.url;
      const isLoginRequest = originalRequestUrl?.endsWith('/auth/login');

      if (error.response.status === 401 && !isLoginRequest) {
         console.warn(`Unauthorized (401) for non-login request (${originalRequestUrl}). Logging out.`);
         if (window.location.pathname !== '/login') {
             removeToken();
             removeUserInfo();
             try { store.dispatch(logout()); } catch (e) { console.error("Dispatch logout failed:", e); }
             window.location.href = '/login';
         }
         return Promise.reject(new Error('Сессия истекла или недействительна. Пожалуйста, войдите снова.'));
      }
    } else {
      console.error('Unexpected error in response interceptor:', error);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
