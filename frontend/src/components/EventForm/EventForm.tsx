import React, { useEffect } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import type { FrontendEvent, EventCategory } from '../../types/event';
import type { EventFormData } from '../../api/events';
import ErrorNotification from '../ErrorNotification/ErrorNotification';
import styles from './EventForm.module.scss';

const categories: EventCategory[] = ['concert', 'lecture', 'exhibition'];

interface EventFormProps {
  initialData?: FrontendEvent | null;
  onSubmit: SubmitHandler<EventFormData>;
  isLoading?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

const EventForm: React.FC<EventFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
  error = null,
  onClearError
}) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors: formErrors },
  } = useForm<EventFormData>({
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      date: initialData?.date
          ? new Date(initialData.date).toISOString().slice(0, 16)
          : '',
      category: initialData?.category || categories[0],
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title,
        description: initialData.description || '',
        date: new Date(initialData.date).toISOString().slice(0, 16),
        category: initialData.category,
      });
    } else {
         reset({
            title: '',
            description: '',
            date: '',
            category: categories[0]
         });
    }
  }, [initialData, reset]);

  const handleFormSubmit: SubmitHandler<EventFormData> = (data) => {
     console.log("Form data submitted:", data);
     onSubmit(data);
  };


  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={styles.eventForm}>
      <ErrorNotification
          message={error}
          title="Ошибка отправки"
          onClearError={onClearError}
      />

      <div className={styles.formGroup}>
        <label htmlFor="title">Название*</label>
        <input
          id="title"
          type="text"
          {...register('title', { required: 'Название обязательно' })}
          disabled={isLoading}
          aria-invalid={formErrors.title ? "true" : "false"}
        />
        {formErrors.title && <p className={styles.error}>{formErrors.title.message}</p>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">Описание</label>
        <textarea
          id="description"
          {...register('description')}
          disabled={isLoading}
          rows={4}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="date">Дата и время*</label>
        <input
          id="date"
          type="datetime-local"
          {...register('date', {
              required: 'Дата и время обязательны',
               validate: value => new Date(value) > new Date() || 'Дата не может быть в прошлом'
            })}
          disabled={isLoading}
          aria-invalid={formErrors.date ? "true" : "false"}
        />
         {formErrors.date && <p className={styles.error}>{formErrors.date.message}</p>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="category">Категория*</label>
        <Controller
          name="category"
          control={control}
          rules={{ required: 'Категория обязательна' }}
          render={({ field }) => (
            <select {...field} id="category" disabled={isLoading} aria-invalid={formErrors.category ? "true" : "false"}>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          )}
        />
         {formErrors.category && <p className={styles.error}>{formErrors.category.message}</p>}
      </div>

      <div className={styles.formActions}>
         <button type="submit" disabled={isLoading}>
           {isLoading
             ? (initialData ? 'Сохранение...' : 'Создание...')
             : (initialData ? 'Сохранить изменения' : 'Создать мероприятие')}
         </button>
      </div>
    </form>
  );
};

export default EventForm;