import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { deleteEventThunk } from '../../../features/events/eventsSlice';
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
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUserId = useAppSelector((state) => state.auth.user?.id);
  const isOwner = currentUserId === event.createdBy;

  const handleEdit = () => {
    navigate(`/event/${event.id}/edit`);
  };

  const handleDelete = () => {
    if (window.confirm(`Вы уверены, что хотите удалить мероприятие "${event.title}"?`)) {
      console.log(`Dispatching deleteEventThunk for event ID: ${event.id}`);
      dispatch(deleteEventThunk(event.id))
        .unwrap()
        .then(() => {
          console.log(`Event ID ${event.id} deleted successfully.`);
        })
        .catch((err) => {
          console.error(`Failed to delete event ID ${event.id}:`, err);
          alert(`Не удалось удалить мероприятие: ${err.message || 'Неизвестная ошибка'}`);
        });
    }
  };


  return (
    <div className={styles.card}>
        {isOwner && (
          <button
            className={styles.deleteButton}
            onClick={handleDelete}
            aria-label={`Удалить мероприятие ${event.title}`}
            title="Удалить мероприятие"
          >
            ×
          </button>
        )}

      <div className={styles.cardContent}>
        <h3 className={styles.title}>{event.title}</h3>
        {event.description && (
          <p className={styles.description}>{event.description}</p>
        )}
        <p className={styles.date}>{formatDate(event.date)}</p>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.category}>{event.category}</span>

        {isOwner ? (
          <button
            className={styles.editButton}
            onClick={handleEdit}
          >
            Редактировать
          </button>
         ) : (
             null
         )}
      </div>
    </div>
  );
};

export default EventCard;