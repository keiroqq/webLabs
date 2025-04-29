import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchUserEventsThunk, clearUserEventsError } from '../../features/events/eventsSlice';
import EventCard from '../Events/components/EventCard';
import Spinner from '../../components/Spinner/Spinner';
import ErrorNotification from '../../components/ErrorNotification/ErrorNotification';
import styles from './ProfilePage.module.scss';

const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const {
    userItems: userEvents,
    isLoadingUserEvents,
    userEventsError
  } = useAppSelector((state) => state.events);

  useEffect(() => {
    dispatch(clearUserEventsError());
    dispatch(fetchUserEventsThunk());
  }, [dispatch]);

  if (!user && !isLoadingUserEvents) {
   return (
       <div className={styles.profileContainer}>
           <ErrorNotification message="Данные пользователя не найдены." />
       </div>
   );
 }

  return (
    <div className={styles.profileContainer}>
   {(!user || isLoadingUserEvents) && <Spinner message="Загрузка данных профиля..." />}

    {user && (
        <>
             <h1 className={styles.pageTitle}>Профиль</h1>
              <div className={styles.userInfo}> <p><strong>Имя:</strong> {user.name}</p> <p><strong>Email:</strong> {user.email}</p> </div>
              <div className={styles.myEventsHeader}> <h2 className={styles.subTitle}>Мои мероприятия</h2> <Link to="/event/new" className={styles.createEventButton}>Создать новое</Link> </div>
             {isLoadingUserEvents && <Spinner size="small" />}
             <ErrorNotification
                 message={userEventsError}
                 onClearError={() => dispatch(clearUserEventsError())}
             />
             {!isLoadingUserEvents && userEvents.length === 0 && !userEventsError && (
                 <p className={styles.noEventsMessage}>Вы еще не создали ни одного мероприятия.</p>
             )}
             {!isLoadingUserEvents && userEvents.length > 0 && !userEventsError && (
                 <div className={styles.eventsGrid}>
                     {userEvents.map((event) => (
                         <EventCard key={event.id} event={event} />
                     ))}
                 </div>
             )}
         </>
     )}
 </div>
);
};

export default ProfilePage;