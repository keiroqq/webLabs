import React from 'react';
import styles from './Spinner.module.scss';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'medium', message }) => {
  const spinnerClass = `${styles.spinner} ${styles[size]}`;

  return (
    <div className={styles.spinnerContainer}>
      <div className={spinnerClass}></div>
      {message && <p className={styles.spinnerText}>{message}</p>}
    </div>
  );
};

export default Spinner;
