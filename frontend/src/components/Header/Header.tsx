import React from 'react';
import { Link } from 'react-router-dom';
import type { FrontendUser } from '../../types/user';
import styles from './Header.module.scss';

interface HeaderProps {
  isAuthenticated: boolean;
  user: FrontendUser | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated, user, onLogout }) => {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link to="/">EventApp</Link>
      </div>
      <nav className={styles.navigation}>
        {isAuthenticated && user ? (
          <>
            <Link to="/profile" className={styles.profileLink}>
              <span className={styles.userName}>Привет, {user.name}!</span>
            </Link>
            <button onClick={onLogout} className={styles.logoutButton}>
              Выйти
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Войти</Link>
            <Link to="/register">Регистрация</Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
