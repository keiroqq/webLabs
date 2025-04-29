import React from 'react';
import styles from './Footer.module.scss';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <p>© {new Date().getFullYear()} EventApp. Все права защищены.</p>
    </footer>
  );
};

export default Footer;
