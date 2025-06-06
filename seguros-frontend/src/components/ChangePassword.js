import React, { useState } from 'react';
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
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    contrasena_actual: '',
    nueva_contrasena: '',
    confirmar_contrasena: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({
    contrasena_actual: '',
    nueva_contrasena: '',
    confirmar_contrasena: ''
  });

  const validateForm = () => {
    const errors = {
      contrasena_actual: '',
      nueva_contrasena: '',
      confirmar_contrasena: ''
    };
    let isValid = true;

    if (!formData.contrasena_actual) {
      errors.contrasena_actual = 'La contraseña actual es requerida';
      isValid = false;
    }

    if (!formData.nueva_contrasena) {
      errors.nueva_contrasena = 'La nueva contraseña es requerida';
      isValid = false;
    } else if (formData.nueva_contrasena.length < 8) {
      errors.nueva_contrasena = 'La contraseña debe tener al menos 8 caracteres';
      isValid = false;
    }

    if (!formData.confirmar_contrasena) {
      errors.confirmar_contrasena = 'La confirmación de contraseña es requerida';
      isValid = false;
    } else if (formData.nueva_contrasena !== formData.confirmar_contrasena) {
      errors.confirmar_contrasena = 'Las contraseñas no coinciden';
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
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
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

      const response = await axios.put(
        'http://localhost:3001/api/users/profile',
        {
          contrasena_actual: formData.contrasena_actual,
          nueva_contrasena: formData.nueva_contrasena
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        // Redirigir al dashboard correspondiente según el rol
        const userRole = user.rol_nombre?.toLowerCase();
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
        }
        navigate(targetPath);
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setError(error.response?.data?.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#f0f2f5'
    }}>
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
            Cambio de Contraseña
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
              name="contrasena_actual"
              label="Contraseña Actual"
              type="password"
              id="contrasena_actual"
              value={formData.contrasena_actual}
              onChange={handleChange}
              error={!!formErrors.contrasena_actual}
              helperText={formErrors.contrasena_actual}
              disabled={loading}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="nueva_contrasena"
              label="Nueva Contraseña"
              type="password"
              id="nueva_contrasena"
              value={formData.nueva_contrasena}
              onChange={handleChange}
              error={!!formErrors.nueva_contrasena}
              helperText={formErrors.nueva_contrasena}
              disabled={loading}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmar_contrasena"
              label="Confirmar Nueva Contraseña"
              type="password"
              id="confirmar_contrasena"
              value={formData.confirmar_contrasena}
              onChange={handleChange}
              error={!!formErrors.confirmar_contrasena}
              helperText={formErrors.confirmar_contrasena}
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
                'Cambiar Contraseña'
              )}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ChangePassword; 