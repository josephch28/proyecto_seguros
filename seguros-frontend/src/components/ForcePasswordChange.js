import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box,
  Typography
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const ForcePasswordChange = () => {
  const { user, updateUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    contrasena_actual: '',
    nueva_contrasena: '',
    confirmar_contrasena: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (password) => {
    const validation = {
      length: password.length >= 8 && password.length <= 20,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password)
    };
    return validation;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validar que las contraseñas coincidan
    if (formData.nueva_contrasena !== formData.confirmar_contrasena) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // Validar requisitos de la contraseña
    const validation = validatePassword(formData.nueva_contrasena);
    if (!validation.length || !validation.uppercase || !validation.lowercase || !validation.number) {
      setError('La contraseña debe tener entre 8 y 20 caracteres, al menos una mayúscula, una minúscula y un número');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.put(
        'http://localhost:3001/api/users/profile',
        {
          ...formData,
          nombre: user.nombre,
          apellido: user.apellido,
          nombre_usuario: user.nombre_usuario,
          correo: user.correo
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setSuccess('Contraseña actualizada exitosamente');
        // Actualizar el contexto con los datos actualizados del usuario
        updateUserProfile(response.data.user);
        // Recargar la página después de 2 segundos
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setError(error.response?.data?.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={true} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown
      disableBackdropClick
    >
      <DialogTitle>
        <Typography variant="h6" component="div" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          Cambio de Contraseña Requerido
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Por seguridad, debes cambiar tu contraseña antes de continuar.
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              margin="normal"
              label="Contraseña Actual"
              type="password"
              name="contrasena_actual"
              value={formData.contrasena_actual}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Nueva Contraseña"
              type="password"
              name="nueva_contrasena"
              value={formData.nueva_contrasena}
              onChange={handleChange}
              required
              helperText="La contraseña debe tener entre 8 y 20 caracteres, al menos una mayúscula, una minúscula y un número"
            />
            <TextField
              fullWidth
              margin="normal"
              label="Confirmar Nueva Contraseña"
              type="password"
              name="confirmar_contrasena"
              value={formData.confirmar_contrasena}
              onChange={handleChange}
              required
            />
          </form>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
          fullWidth
        >
          {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ForcePasswordChange; 