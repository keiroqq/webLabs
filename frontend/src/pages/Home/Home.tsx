import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.module.scss';

const Home: React.FC = () => {
  return (
    <div className={styles.homeContainer}>
      <main className={styles.mainContent}>
        <h1>Добро пожаловать в EventApp!</h1>
        <p>
          Это приложение для поиска и управления различными мероприятиями.
          Просматривайте список событий, регистрируйтесь и создавайте свои!
        </p>
        <Link to="/events" className={styles.eventsButton}>
          К мероприятиям
        </Link>
      </main>
    </div>
  );
};

export default Home;
