import React, { useState, useEffect } from 'react';
import { fetchEvents } from '../../api/events';
import type { FrontendEvent } from '../../types/event';
import EventCard from './components/EventCard';
import styles from './Events.module.scss';

const Events: React.FC = () => {
  const [events, setEvents] = useState<FrontendEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchEvents();
        setEvents(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Произошла неизвестная ошибка');
        }
        console.error(err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  return (
    <div className={styles.eventsPageContainer}>
      <h1 className={styles.pageTitle}>Список мероприятий</h1>

      {loading && <p className={styles.loadingMessage}>Загрузка мероприятий...</p>}

      {error && <p className={styles.errorMessage}>Ошибка: {error}</p>}

      {!loading && !error && events.length === 0 && (
        <p className={styles.noEventsMessage}>Мероприятий пока нет.</p>
      )}

      {!loading && !error && events.length > 0 && (
        <div className={styles.eventsGrid}>
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;