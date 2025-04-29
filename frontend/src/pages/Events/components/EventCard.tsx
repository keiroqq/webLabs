import React from 'react';
import { FrontendEvent } from '../../../types/event';
import styles from './EventCard.module.scss';

interface EventCardProps {
  event: FrontendEvent;
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date
      .toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      .replace(' г.', '');
  } catch (e) {
    console.error('Invalid date format:', dateString);
    return 'Неверная дата';
  }
};

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  return (
    <div className={styles.card}>
      <div className={styles.cardContent}>
        <h3 className={styles.title}>{event.title}</h3>
        {event.description && (
          <p className={styles.description}>{event.description}</p>
        )}
        <p className={styles.date}>{formatDate(event.date)}</p>
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.category}>{event.category}</span>
        <button
          className={styles.editButton}
          onClick={() => alert(`Редактировать ${event.id}`)}
          disabled
        >
          Редактировать
        </button>
      </div>
    </div>
  );
};

export default EventCard;
