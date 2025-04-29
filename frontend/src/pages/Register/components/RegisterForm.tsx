import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { registerUser } from '../../../api/auth';
import styles from './RegisterForm.module.scss';

interface RegisterFormProps {
  onRegisterSuccess: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess }) => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await registerUser({ name, email, password });
      console.log('Registration successful via API (axios):', response.message);
      onRegisterSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Произошла неизвестная ошибка при регистрации.');
      }
      console.error('Registration failed (axios):', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className={styles.registerForm} onSubmit={handleSubmit}>
      <h2>Регистрация</h2>
      {error && <p className={styles.errorMessage}>{error}</p>}
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
