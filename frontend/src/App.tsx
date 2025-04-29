import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home/Home';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ProfilePage from './pages/Profile/ProfilePage';
import Events from './pages/Events/Events';
import EventFormPage from './pages/EventFormPage/EventFormPage';
import NotFound from './pages/NotFound/NotFound';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="events" element={<Events />} />

        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="event/new" element={<EventFormPage />} />
          <Route path="event/:id/edit" element={<EventFormPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default App;
