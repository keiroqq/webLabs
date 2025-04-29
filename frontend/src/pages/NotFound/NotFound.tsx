import React from 'react';
import { Link } from 'react-router-dom';
import styles from './NotFound.module.scss';

const NotFound: React.FC = () => {
  return (
    <div className={styles.notFoundContainer}>
      <h1 className={styles.errorCode}>404</h1>
      <h2 className={styles.title}>Страница не найдена</h2>
      <p className={styles.message}>
        Извините, страница, которую вы ищете, не существует или была перемещена.
      </p>
      <Link to="/" className={styles.homeLink}>
        Вернуться на главную
      </Link>
    </div>
  );
};

export default NotFound;