import React from 'react';
import styles from './ErrorNotification.module.scss';

interface ErrorNotificationProps {
  message: string | null | undefined;
  title?: string;
  onClearError?: () => void;
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  message,
  title = 'Ошибка',
  onClearError,
}) => {
  if (!message) {
    return null;
  }

  return (
    <div className={styles.errorContainer} role="alert">
      <div className={styles.errorHeader}>
        <span className={styles.errorTitle}>{title}</span>
        {onClearError && (
          <button
            onClick={onClearError}
            className={styles.closeButton}
            aria-label="Закрыть ошибку"
          >
            ×
          </button>
        )}
      </div>
      <p className={styles.errorMessage}>{message}</p>
    </div>
  );
};

export default ErrorNotification;