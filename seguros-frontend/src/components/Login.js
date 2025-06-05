import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  CircularProgress,
  IconButton
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import TopBar from './TopBar';
import CloseIcon from '@mui/icons-material/Close';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    contrasena: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({
    nombre_usuario: '',
    contrasena: ''
  });
  const [loginSuccess, setLoginSuccess] = useState(false);

  useEffect(() => {
    if (loginSuccess && isAuthenticated && user) {
      const userRole = user.rol_nombre?.toLowerCase();
      if (userRole) {
        let targetPath = '/';
        switch (userRole) {
          case 'administrador':
            targetPath = '/admin';
            break;
          case 'cliente':
            targetPath = '/client';
            break;
          case 'asesor':
          case 'agente':
            targetPath = '/agent';
            break;
          default:
            console.error('Rol no reconocido:', userRole);
            return;
        }
        navigate(targetPath);
      }
    }
  }, [loginSuccess, isAuthenticated, user, navigate]);

  const validateForm = () => {
    const errors = {
      nombre_usuario: '',
      contrasena: ''
    };
    let isValid = true;

    if (!formData.nombre_usuario.trim()) {
      errors.nombre_usuario = 'El nombre de usuario es requerido';
      isValid = false;
    }

    if (!formData.contrasena) {
      errors.contrasena = 'La contraseña es requerida';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    // Limpiar error general cuando el usuario empieza a escribir
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');
      const result = await login(formData);
      
      if (!result.success) {
        setError(result.error);
        setLoginSuccess(false);
      } else {
        setLoginSuccess(true);
      }
    } catch (error) {
      setError('Error al intentar iniciar sesión');
      setLoginSuccess(false);
      console.error('Error en login:', error);
    } finally {
      setLoading(false);
    }
  };

  // Si ya está autenticado y el login fue exitoso, no renderizar nada
  if (loginSuccess && isAuthenticated && user) {
    return null;
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#f0f2f5'
    }}>
      <TopBar />
      <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: 'white',
            borderRadius: 2
          }}
        >
          <Typography
            component="h1"
            variant="h5"
            sx={{
              mb: 3,
              color: '#1e3a5f',
              fontWeight: 600
            }}
          >
            GOSafe Seguros S.A.
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{ width: '100%', mb: 2 }}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => setError('')}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="nombre_usuario"
              label="Nombre de usuario"
              name="nombre_usuario"
              autoComplete="username"
              autoFocus
              value={formData.nombre_usuario}
              onChange={handleChange}
              error={!!formErrors.nombre_usuario}
              helperText={formErrors.nombre_usuario}
              disabled={loading}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="contrasena"
              label="Contraseña"
              type="password"
              id="contrasena"
              autoComplete="current-password"
              value={formData.contrasena}
              onChange={handleChange}
              error={!!formErrors.contrasena}
              helperText={formErrors.contrasena}
              disabled={loading}
              sx={{ mb: 3 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 2,
                mb: 2,
                bgcolor: '#1e3a5f',
                color: 'white',
                '&:hover': { bgcolor: '#2c5282' },
                height: '48px',
                fontSize: '16px',
                textTransform: 'none'
              }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </Box>
        </Paper>
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 4 }}>
          © 1990-2000xsiempre GOSafe Seguros S.A. Todos los derechos reservados.
        </Typography>
      </Container>
    </Box>
  );
};

export default Login; 