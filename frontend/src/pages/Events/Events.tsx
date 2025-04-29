import React, { useState, useEffect } from 'react';
import { fetchEvents } from '../../api/events';
import type { FrontendEvent, EventCategory } from '../../types/event';
import EventCard from './components/EventCard';
import styles from './Events.module.scss';

const availableCategories: EventCategory[] = [
  'concert',
  'lecture',
  'exhibition',
];
type FilterCategory = EventCategory | null;

const Events: React.FC = () => {
  const [events, setEvents] = useState<FrontendEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<FilterCategory>(null);

  useEffect(() => {
    const loadEvents = async () => {
      console.log(`Effect triggered. Selected category: ${selectedCategory}`);
      setLoading(true);
      setError(null);
      try {
        const data = await fetchEvents(selectedCategory);
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
  }, [selectedCategory]);

  const handleCategoryChange = (category: FilterCategory) => {
    console.log(`Category changed to: ${category}`);
    setSelectedCategory(category);
  };

  const getCategoryDisplayName = (category: EventCategory): string => {
    switch (category) {
      case 'concert':
        return 'Концерты';
      case 'lecture':
        return 'Лекции';
      case 'exhibition':
        return 'Выставки';
      default:
        return category;
    }
  };

  return (
    <div className={styles.eventsPageContainer}>
      <h1 className={styles.pageTitle}>Список мероприятий</h1>

      <div className={styles.filterContainer}>
        <span className={styles.filterLabel}>Фильтр:</span>
        <button
          onClick={() => handleCategoryChange(null)}
          className={`${styles.filterButton} ${selectedCategory === null ? styles.activeFilter : ''}`}
        >
          Все
        </button>
        {availableCategories.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            className={`${styles.filterButton} ${selectedCategory === category ? styles.activeFilter : ''}`}
          >
            {getCategoryDisplayName(category)}
          </button>
        ))}
      </div>

      {loading && (
        <p className={styles.loadingMessage}>Загрузка мероприятий...</p>
      )}

      {error && <p className={styles.errorMessage}>Ошибка: {error}</p>}

      {!loading && !error && events.length === 0 && (
        <p className={styles.noEventsMessage}>
          {selectedCategory
            ? `Мероприятий в категории "${getCategoryDisplayName(selectedCategory)}" не найдено.`
            : 'Мероприятий пока нет.'}
        </p>
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
