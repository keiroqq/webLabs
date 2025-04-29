import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import { logoutUserThunk, clearAuthError } from '../../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import ErrorNotification from '../ErrorNotification/ErrorNotification';
import styles from './Layout.module.scss';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, error: authError } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    dispatch(logoutUserThunk())
        .unwrap()
        .then(() => navigate('/login'))
        .catch((err) => console.error('Logout thunk failed:', err));
  };

  return (
    <div className={styles.layoutContainer}>
      <Header
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
      />
      <main className={styles.mainContent}>
        {authError && location.pathname !== '/login' && location.pathname !== '/register' && (
             <ErrorNotification
                 message={authError}
                 onClearError={() => dispatch(clearAuthError())}
             />
        )}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;