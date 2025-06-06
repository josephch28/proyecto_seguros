import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Box, CircularProgress } from '@mui/material';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  console.log('AuthProvider Estado:', { 
    user, 
    isAuthenticated, 
    loading, 
    initialized,
    userRole: user?.rol_nombre || user?.rol
  });

  const normalizeUserData = (userData) => {
    if (!userData) return null;
    
    // Asegurarse de que la foto_perfil tenga la URL completa y convertir cambiar_contrasena a booleano
    const normalizedData = {
      ...userData,
      rol_nombre: userData.rol_nombre || userData.rol,
      foto_perfil: userData.foto_perfil ? 
        `http://localhost:3001/uploads/${userData.foto_perfil}?t=${new Date().getTime()}` : 
        null,
      cambiarContrasena: Boolean(userData.cambiar_contrasena || userData.cambiarContrasena)
    };
    
    console.log('Datos normalizados del usuario:', normalizedData);
    return normalizedData;
  };

  const handleLogout = () => {
    console.log('Ejecutando logout...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
    setInitialized(true);
  };

  const checkAuth = async () => {
    console.log('Verificando autenticación...');
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      console.log('Token encontrado:', !!token);
      console.log('Usuario almacenado:', !!storedUser);
      
      if (!token || !storedUser) {
        console.log('No hay token o usuario almacenado, haciendo logout');
        handleLogout();
        return;
      }

      let parsedUser;
      try {
        parsedUser = JSON.parse(storedUser);
        console.log('Usuario parseado:', parsedUser);
        console.log('Rol del usuario parseado:', parsedUser.rol_nombre || parsedUser.rol);
      } catch (e) {
        console.error('Error al parsear usuario almacenado:', e);
        handleLogout();
        return;
      }

      console.log('Haciendo petición de verificación...');
      const response = await axios.get('http://localhost:3001/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Respuesta de verificación completa:', response.data);
      
      if (response.data.success && response.data.user) {
        console.log('Verificación exitosa, datos del usuario:', response.data.user);
        console.log('Rol del usuario en la respuesta:', response.data.user.rol_nombre || response.data.user.rol);
        
        // Normalizar los datos del usuario
        const userData = normalizeUserData(response.data.user);
        
        console.log('Datos finales del usuario:', userData);
        
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        console.log('Verificación fallida, haciendo logout');
        handleLogout();
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      }
      handleLogout();
    } finally {
      console.log('Finalizando verificación...');
      setLoading(false);
      setInitialized(true);
    }
  };

  useEffect(() => {
    console.log('AuthProvider montado, iniciando verificación...');
    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      console.log('Iniciando login...');
      setLoading(true);
      const response = await axios.post('http://localhost:3001/api/auth/login', credentials);
      
      console.log('Respuesta de login completa:', response.data);
      
      if (response.data.success && response.data.token && response.data.user) {
        console.log('Login exitoso, datos del usuario:', response.data.user);
        console.log('Estado de cambio de contraseña:', response.data.user.cambiarContrasena);
        
        // Normalizar los datos del usuario
        const userData = normalizeUserData(response.data.user);
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true, user: userData };
      }
      
      return {
        success: false,
        error: response.data.message || 'Error al iniciar sesión'
      };
    } catch (error) {
      console.error('Error detallado en login:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      let errorMessage = 'Error al conectar con el servidor';
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Usuario o contraseña incorrectos';
            break;
          case 404:
            errorMessage = 'Usuario no encontrado';
            break;
          case 400:
            errorMessage = error.response.data.message || 'Datos de inicio de sesión inválidos';
            break;
          default:
            errorMessage = error.response.data.message || 'Error en el servidor';
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor';
      }

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Mostrar indicador de carga mientras se inicializa
  if (!initialized) {
    console.log('AuthProvider no inicializado, mostrando loader...');
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: '#f0f2f5'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  console.log('AuthProvider inicializado, renderizando children...');
  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout: handleLogout,
    checkAuth,
    updateUserProfile: (newUserData) => {
      const normalizedData = normalizeUserData(newUserData);
      setUser(normalizedData);
      localStorage.setItem('user', JSON.stringify(normalizedData));
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext; 