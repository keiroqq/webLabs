import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import styles from './Login.module.scss';

const checkAuthStatus = (): boolean => {
  return !!localStorage.getItem('authToken');
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    if (checkAuthStatus()) {
      console.log('User already authenticated, redirecting to /events');
      navigate('/events', { replace: true });
    }
  }, [navigate]);
  const handleLoginSuccess = () => {
    console.log('Login successful on page level, navigating to /events');
    navigate('/events');
  };

  return (
    <div className={styles.loginPageContainer}>
      <LoginForm onLoginSuccess={handleLoginSuccess} />
    </div>
  );
};

export default Login;