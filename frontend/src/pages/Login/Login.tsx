import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import styles from './Login.module.scss';
import { useAppSelector } from '../../app/hooks';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User already authenticated (from Redux state), redirecting...');
      navigate('/events', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className={styles.loginPageContainer}>
      <LoginForm/>
    </div>
  );
};

export default Login;