import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import {
  deleteEventThunk,
  registerForEventThunk,
  unregisterFromEventThunk,
  clearRegisterError,
  setViewingParticipantsEventId,
} from '../../../features/events/eventsSlice';
import { FrontendEvent } from '../../../types/event';
import Spinner from '../../../components/Spinner/Spinner';
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
  const { isRegistering, registeringEventId, registerError } = useAppSelector(
    (state) => state.events,
  );

  const isOwner = currentUserId === event.createdBy;
  const isProcessingParticipation =
    isRegistering && registeringEventId === event.id;

  const handleEdit = () => {
    navigate(`/event/${event.id}/edit`);
  };

  const handleDelete = () => {
    if (
      window.confirm(
        `Вы уверены, что хотите удалить мероприятие "${event.title}"?`,
      )
    ) {
      dispatch(deleteEventThunk(event.id))
        .unwrap()
        .then(() => console.log(`Event ID ${event.id} deleted.`))
        .catch((err) =>
          alert(`Не удалось удалить: ${err.message || 'Неизвестная ошибка'}`),
        );
    }
  };

  const handleParticipationToggle = () => {
    dispatch(clearRegisterError());
    if (event.isCurrentUserParticipant) {
      console.log(
        `Dispatching unregisterFromEventThunk for event ID: ${event.id}`,
      );
      dispatch(unregisterFromEventThunk(event.id));
    } else {
      console.log(
        `Dispatching registerForEventThunk for event ID: ${event.id}`,
      );
      dispatch(registerForEventThunk(event.id));
    }
  };

  const handleViewParticipants = () => {
    console.log(`View participants for event ID: ${event.id}`);
    dispatch(setViewingParticipantsEventId(event.id));
  };

  return (
    <div className={styles.card}>
      {isOwner && (
        <button
          className={styles.deleteButton}
          onClick={handleDelete}
          title="Удалить мероприятие"
        >
          ×
        </button>
      )}

      <div className={styles.cardContent}>
        <h3 className={styles.title}>{event.title}</h3>
        {event.description && (
          <p className={styles.description} title={event.description}>
            {event.description}
          </p>
        )}
        <p className={styles.date}>{formatDate(event.date)}</p>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.footerLeft}>
          <span className={styles.category}>{event.category}</span>
          <button
            className={styles.participantsButton}
            onClick={handleViewParticipants}
            title="Посмотреть участников"
            disabled={event.participantsCount === 0}
          >
            Участников: {event.participantsCount}
          </button>
        </div>

        <div className={styles.footerRight}>
          {registeringEventId === event.id && registerError && (
            <span className={styles.registerErrorText} title={registerError}>
              !
            </span>
          )}

          {isOwner ? (
            <button className={styles.editButton} onClick={handleEdit}>
              Редактировать
            </button>
          ) : (
            <button
              className={`${styles.participateButton} ${event.isCurrentUserParticipant ? styles.cancelParticipation : ''}`}
              onClick={handleParticipationToggle}
              disabled={isProcessingParticipation}
            >
              {isProcessingParticipation ? (
                <Spinner size="small" />
              ) : event.isCurrentUserParticipant ? (
                'Отменить участие'
              ) : (
                'Участвовать'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
