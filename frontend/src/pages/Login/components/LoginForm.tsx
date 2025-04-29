import React, { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  loginUserThunk,
  clearAuthError,
} from '../../../features/auth/authSlice';
import ErrorNotification from '../../../components/ErrorNotification/ErrorNotification';
import styles from './LoginForm.module.scss';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const navigate = useNavigate();

  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      console.log(
        'Login successful (detected by isAuthenticated state), navigating...',
      );
      navigate('/events');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('Dispatching loginUserThunk');
    dispatch(loginUserThunk({ email, password }));
  };

  return (
    <form className={styles.loginForm} onSubmit={handleSubmit}>
      <h2>Вход в систему</h2>
      <ErrorNotification
        message={error}
        onClearError={() => dispatch(clearAuthError())}
      />
      <div className={styles.formGroup}>
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="password">Пароль:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Вход...' : 'Войти'}
      </button>
      <p className={styles.registerLink}>
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </form>
  );
};

export default LoginForm;
