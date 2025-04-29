import React, { useState, FormEvent, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  registerUserThunk,
  clearAuthError,
} from '../../../features/auth/authSlice';
import ErrorNotification from '../../../components/ErrorNotification/ErrorNotification';
import styles from './RegisterForm.module.scss';

interface RegisterFormProps {
  onRegisterSuccess: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess }) => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 6) {
      alert('Пароль должен содержать не менее 6 символов.');
      return;
    }

    console.log('Dispatching registerUserThunk');
    dispatch(registerUserThunk({ name, email, password }))
      .unwrap()
      .then(() => {
        console.log('Register thunk fulfilled');
        onRegisterSuccess();
      })
      .catch((err) => {
        console.error('Register thunk rejected:', err);
      });
  };

  return (
    <form className={styles.registerForm} onSubmit={handleSubmit}>
      <h2>Регистрация</h2>
      <ErrorNotification
        message={error}
        onClearError={() => dispatch(clearAuthError())}
      />
      <div className={styles.formGroup}>
        <label htmlFor="name">Имя:</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
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
        <label htmlFor="password">Пароль (мин. 6 симв.):</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          disabled={isLoading}
        />
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
      </button>
      <p className={styles.loginLink}>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </form>
  );
};

export default RegisterForm;
