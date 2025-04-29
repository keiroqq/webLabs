import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  fetchEventByIdThunk,
  createEventThunk,
  updateEventThunk,
  clearEditableEvent,
  clearSubmittingError,
  clearEventsError,
} from '../../features/events/eventsSlice';
import EventForm from '../../components/EventForm/EventForm';
import Spinner from '../../components/Spinner/Spinner';
import ErrorNotification from '../../components/ErrorNotification/ErrorNotification';
import type { EventFormData } from '../../api/events';
import styles from './EventFormPage.module.scss';

const EventFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isEditMode = Boolean(id);

  const {
    editableEvent,
    isLoadingEditable,
    errorEditable,
    isSubmitting,
    submittingError,
  } = useAppSelector((state) => state.events);

  useEffect(() => {
    dispatch(clearSubmittingError());
    if (errorEditable) dispatch(clearEventsError());

    if (isEditMode && id) {
      dispatch(clearEditableEvent());
      dispatch(fetchEventByIdThunk(id));
    } else {
      dispatch(clearEditableEvent());
    }

    return () => {
      dispatch(clearEditableEvent());
      dispatch(clearSubmittingError());
      if (errorEditable) dispatch(clearEventsError());
    };
  }, [id, isEditMode, dispatch, errorEditable]);

  const handleFormSubmit = (data: EventFormData) => {
    dispatch(clearSubmittingError());
    if (isEditMode && id) {
      dispatch(updateEventThunk({ id, eventData: data }))
        .unwrap()
        .then(() => navigate('/profile'))
        .catch((err) => console.error('Failed to update event:', err));
    } else {
      dispatch(createEventThunk(data))
        .unwrap()
        .then(() => navigate('/profile'))
        .catch((err) => console.error('Failed to create event:', err));
    }
  };

  if (isEditMode && isLoadingEditable) {
    return (
      <div className={styles.pageContainer}>
        <Spinner message="Загрузка данных мероприятия..." />
      </div>
    );
  }

  if (isEditMode && errorEditable) {
    return (
      <div className={styles.pageContainer}>
        <ErrorNotification
          title="Ошибка загрузки"
          message={errorEditable}
          onClearError={() => dispatch(clearEventsError())}
        />
      </div>
    );
  }

  if (isEditMode && !isLoadingEditable && !editableEvent) {
    return (
      <div className={styles.pageContainer}>
        <ErrorNotification
          title="Ошибка"
          message="Мероприятие для редактирования не найдено."
        />
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>
        {isEditMode
          ? 'Редактирование мероприятия'
          : 'Создание нового мероприятия'}
      </h1>
      <EventForm
        initialData={isEditMode ? editableEvent : null}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
        error={submittingError}
        onClearError={() => dispatch(clearSubmittingError())}
      />
    </div>
  );
};

export default EventFormPage;
