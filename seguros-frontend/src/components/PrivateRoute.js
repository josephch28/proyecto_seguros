import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ roles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.cambiarContrasena) {
    return <Navigate to="/change-password" replace />;
  }

  if (roles && !roles.includes(user?.rol_nombre?.toLowerCase())) {
    // Redirigir al dashboard correspondiente según el rol
    const dashboardPath = {
      administrador: '/admin',
      agente: '/agent',
      asesor: '/agent',
      cliente: '/client'
    }[user?.rol_nombre?.toLowerCase()] || '/login';

    return <Navigate to={dashboardPath} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute; 