import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from './components/RegisterForm';
import styles from './Register.module.scss';
import { useAppSelector } from '../../app/hooks';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('User already authenticated, redirecting to /events');
      navigate('/events', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleRegisterSuccess = () => {
    console.log('Registration successful callback received');
    setShowSuccessMessage(true);
    setTimeout(() => {
      navigate('/login');
    }, 3000);
  };

  return (
    <div className={styles.registerPageContainer}>
      {showSuccessMessage ? (
        <div className={styles.successMessage}>
           <h2>Регистрация успешна!</h2>
           <p>Теперь вы можете войти в систему.</p>
           <p>Перенаправление на страницу входа...</p>
        </div>
      ) : (
        <RegisterForm onRegisterSuccess={handleRegisterSuccess} />
      )}
    </div>
  );
};

export default Register;