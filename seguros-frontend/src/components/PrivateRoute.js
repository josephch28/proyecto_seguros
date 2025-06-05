import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || !user.id) {
    // Si no hay token o usuario, redirigir al login
    localStorage.clear(); // Limpiar cualquier dato residual
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.rol_nombre)) {
    // Si el usuario no tiene el rol permitido, redirigir a su dashboard correspondiente
    switch (user.rol_nombre) {
      case 'administrador':
        return <Navigate to="/admin/dashboard" replace />;
      case 'cliente':
        return <Navigate to="/cliente/dashboard" replace />;
      case 'agente':
        return <Navigate to="/agente/dashboard" replace />;
      default:
        localStorage.clear();
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default PrivateRoute; 