// src/components/Layout/Layout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import type { FrontendUser } from '../../types/user';
import { logoutUser } from '../../api/auth';
import {
  getToken,
  getUserInfo,
  removeToken,
  removeUserInfo,
  isAuthenticated,
} from '../../utils/storage';
import styles from './Layout.module.scss';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuthenticatedState, setIsAuthenticatedState] =
    useState<boolean>(isAuthenticated);
  const [currentUser, setCurrentUser] = useState<FrontendUser | null>(
    getUserInfo(),
  );
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Location changed - Re-checking auth state via utils.');
    setIsAuthenticatedState(!!getToken());
    setCurrentUser(getUserInfo());
    setLogoutError(null);
  }, [location]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'authToken' || event.key === 'userInfo') {
        console.log('Storage changed - Updating auth state via utils.');
        setIsAuthenticatedState(!!getToken());
        setCurrentUser(getUserInfo());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = async () => {
    setLogoutError(null);
    const token = getToken();
    console.log('Attempting logout with token (from util):', !!token);
    try {
      if (token) {
        await logoutUser(token);
        console.log('Logout successful via API.');
      } else {
        console.warn('Local token not found, skipping API logout call.');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      if (error instanceof Error) {
        if (!error.message.includes('401')) {
          setLogoutError(`Ошибка выхода на сервере: ${error.message}`);
        }
      } else {
        const errorString = String(error);
        if (!errorString.includes('401')) {
          setLogoutError('Неизвестная ошибка при выходе на сервере.');
        }
      }
    } finally {
      console.log('Performing local logout (removing token and user info)...');
      removeToken();
      removeUserInfo();
      setIsAuthenticatedState(false);
      setCurrentUser(null);
      navigate('/login');
    }
  };

  return (
    <div className={styles.layoutContainer}>
      <Header
        isAuthenticated={isAuthenticatedState}
        user={currentUser}
        onLogout={handleLogout}
      />
      <main className={styles.mainContent}>
        {logoutError && (
          <p className={styles.logoutErrorMessage}>{logoutError}</p>
        )}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
