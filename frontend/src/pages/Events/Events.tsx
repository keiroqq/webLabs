import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  clearEventsError,
  fetchEventsThunk,
  setFilterCategory,
} from '../../features/events/eventsSlice';
import type { EventCategory } from '../../types/event';
import EventCard from './components/EventCard';
import Spinner from '../../components/Spinner/Spinner';
import ErrorNotification from '../../components/ErrorNotification/ErrorNotification';
import styles from './Events.module.scss';

const availableCategories: EventCategory[] = [
  'concert',
  'lecture',
  'exhibition',
];
type FilterCategory = EventCategory | null;

const Events: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    items: events,
    isLoading,
    error,
    filterCategory: selectedCategory,
  } = useAppSelector((state) => state.events);

  useEffect(() => {
    dispatch(clearEventsError());
    dispatch(fetchEventsThunk(selectedCategory));
  }, [selectedCategory, dispatch]);

  const handleCategoryChange = (category: FilterCategory) => {
    dispatch(setFilterCategory(category));
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
            {' '}
            {getCategoryDisplayName(category)}{' '}
          </button>
        ))}
      </div>

      {isLoading && <Spinner message="Загрузка мероприятий..." />}
      <ErrorNotification
        message={error}
        onClearError={() => dispatch(clearEventsError())}
      />
      {!isLoading && events.length === 0 && !error && (
        <p className={styles.noEventsMessage}>
          {selectedCategory
            ? `Мероприятий в категории "${getCategoryDisplayName(selectedCategory)}" не найдено.`
            : 'Мероприятий пока нет.'}
        </p>
      )}
      {!isLoading && events.length > 0 && !error && (
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
