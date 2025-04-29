import React, { useEffect } from 'react';
import Modal from 'react-modal';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  fetchEventParticipantsThunk,
  setViewingParticipantsEventId,
} from '../../features/events/eventsSlice';
import Spinner from '../Spinner/Spinner';
import ErrorNotification from '../ErrorNotification/ErrorNotification';
import styles from './EventParticipantsModal.module.scss';

const EventParticipantsModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    viewingParticipantsEventId: eventId,
    participants,
    isLoadingParticipants,
    participantsError,
  } = useAppSelector((state) => state.events);

  useEffect(() => {
    if (eventId !== null) {
      console.log(
        `Modal opened for event ${eventId}, fetching participants...`,
      );
      dispatch(fetchEventParticipantsThunk(eventId));
    }
  }, [eventId, dispatch]);

  const handleCloseModal = () => {
    dispatch(setViewingParticipantsEventId(null));
  };

  const isModalOpen = eventId !== null;

  return (
    <Modal
      isOpen={isModalOpen}
      onRequestClose={handleCloseModal}
      contentLabel="Список участников мероприятия"
      className={styles.modalContent}
      overlayClassName={styles.modalOverlay}
      shouldCloseOnOverlayClick={true}
      shouldCloseOnEsc={true}
    >
      <div className={styles.modalHeader}>
        <h2>Участники мероприятия</h2>
        <button onClick={handleCloseModal} className={styles.closeButton}>
          ×
        </button>
      </div>

      <div className={styles.modalBody}>
        {isLoadingParticipants && (
          <Spinner message="Загрузка списка..." size="small" />
        )}

        <ErrorNotification message={participantsError} />

        {!isLoadingParticipants &&
          !participantsError &&
          participants.length === 0 && (
            <p>На это мероприятие пока никто не зарегистрировался.</p>
          )}

        {!isLoadingParticipants &&
          !participantsError &&
          participants.length > 0 && (
            <ul className={styles.participantsList}>
              {participants.map((participant) => (
                <li key={participant.id}>
                  <span className={styles.participantName}>
                    {participant.name}
                  </span>
                  <span className={styles.participantEmail}>
                    ({participant.email})
                  </span>
                </li>
              ))}
            </ul>
          )}
      </div>
    </Modal>
  );
};

export default EventParticipantsModal;
