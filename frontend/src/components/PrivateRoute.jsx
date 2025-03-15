import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    // Se não há token, redirecionar para /login
    return <Navigate to="/login" />;
  }
  // Se há token, exibe o conteúdo
  return children;
}

export default PrivateRoute;
