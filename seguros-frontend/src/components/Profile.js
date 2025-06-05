import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Avatar,
  Box,
  Alert,
  IconButton,
  Typography,
  Paper,
  Divider,
  CircularProgress
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Profile = ({ open, onClose }) => {
  const { user: authUser, checkAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    nombre_usuario: '',
    correo: '',
    contrasena: '',
    confirmar_contrasena: '',
    provincia: '',
    canton: '',
    direccion: '',
    telefono: '',
    cargo: '',
    foto_perfil: null
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  });
  const [formErrors, setFormErrors] = useState({
    nombre: '',
    apellido: '',
    nombre_usuario: '',
    correo: '',
    telefono: ''
  });
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (open && authUser?.id) {
      console.log('Profile - Iniciando fetchUserData con authUser:', authUser);
      fetchUserData();
    }
  }, [open, authUser?.id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      setUserData(null);
      
      if (!token || !authUser) {
        console.error('Profile - No hay token o usuario:', { token: !!token, authUser });
        throw new Error('No se encontró información de autenticación');
      }

      console.log('Profile - Haciendo petición al servidor para el usuario:', authUser.id);
      const response = await axios.get(`http://localhost:3001/api/users/${authUser.id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Profile - Respuesta del servidor:', response.data);

      if (response.data && response.data.success && response.data.user) {
        console.log('Profile - Datos de usuario recibidos:', response.data.user);
        const userData = response.data.user;
        setUserData(userData);
        
        const cleanedData = {
          nombre: userData.nombre || '',
          apellido: userData.apellido || '',
          nombre_usuario: userData.nombre_usuario || '',
          correo: userData.correo || '',
          contrasena: '',
          confirmar_contrasena: '',
          provincia: userData.provincia || '',
          canton: userData.canton || '',
          direccion: userData.direccion || '',
          telefono: userData.telefono || '',
          cargo: userData.cargo || '',
          foto_perfil: null
        };
        setFormData(cleanedData);

        if (userData.foto_perfil) {
          const imageUrl = `http://localhost:3001/uploads/${userData.foto_perfil}`;
          console.log('Profile - Intentando cargar imagen:', imageUrl);
          setPreviewUrl(imageUrl);
          
          try {
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
              console.error('Profile - La imagen no se pudo cargar:', imageUrl);
              setPreviewUrl('');
            }
          } catch (error) {
            console.error('Profile - Error al verificar la imagen:', error);
            setPreviewUrl('');
          }
        } else {
          setPreviewUrl('');
        }
      } else {
        console.error('Profile - Respuesta sin datos de usuario:', response.data);
        throw new Error(response.data?.message || 'No se pudo obtener la información del usuario');
      }
    } catch (error) {
      console.error('Profile - Error completo:', error);
      console.error('Profile - Response data:', error.response?.data);
      console.error('Profile - Response status:', error.response?.status);
      
      let errorMessage = 'Error al cargar los datos del usuario';
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Sesión expirada. Por favor, vuelva a iniciar sesión.';
            break;
          case 403:
            errorMessage = 'No tiene permisos para acceder a esta información.';
            break;
          case 404:
            errorMessage = 'Usuario no encontrado.';
            break;
          default:
            errorMessage = error.response.data?.message || 'Error al cargar los datos del usuario';
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor. Por favor, verifique su conexión.';
      }
      
      setError(errorMessage);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const validatePasswordRules = (password) => {
    return {
      length: password.length >= 8 && password.length <= 20,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password)
    };
  };

  const validateForm = () => {
    const errors = {
      nombre: '',
      apellido: '',
      nombre_usuario: '',
      correo: '',
      telefono: '',
      contrasena: '',
      confirmar_contrasena: ''
    };
    let isValid = true;

    // Validar nombre
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
      isValid = false;
    }

    // Validar apellido
    if (!formData.apellido.trim()) {
      errors.apellido = 'El apellido es requerido';
      isValid = false;
    }

    // Validar nombre de usuario
    if (!formData.nombre_usuario.trim()) {
      errors.nombre_usuario = 'El nombre de usuario es requerido';
      isValid = false;
    } else if (formData.nombre_usuario.length < 3) {
      errors.nombre_usuario = 'El nombre de usuario debe tener al menos 3 caracteres';
      isValid = false;
    }

    // Validar correo
    if (!formData.correo.trim()) {
      errors.correo = 'El correo electrónico es requerido';
      isValid = false;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.correo)) {
      errors.correo = 'Correo electrónico inválido';
      isValid = false;
    }

    // Validar teléfono si se proporciona
    if (formData.telefono && !/^[0-9]{8,10}$/.test(formData.telefono)) {
      errors.telefono = 'El teléfono debe tener entre 8 y 10 dígitos';
      isValid = false;
    }

    // Validar contraseña y confirmación si se está cambiando
    if (formData.contrasena) {
      const validation = validatePasswordRules(formData.contrasena);
      if (!validation.length) {
        errors.contrasena = 'La contraseña debe tener entre 8 y 20 caracteres';
        isValid = false;
      }
      if (!validation.uppercase) {
        errors.contrasena = 'La contraseña debe contener al menos una letra mayúscula';
        isValid = false;
      }
      if (!validation.lowercase) {
        errors.contrasena = 'La contraseña debe contener al menos una letra minúscula';
        isValid = false;
      }
      if (!validation.number) {
        errors.contrasena = 'La contraseña debe contener al menos un número';
        isValid = false;
      }
      if (!formData.confirmar_contrasena) {
        errors.confirmar_contrasena = 'Debe confirmar la contraseña';
        isValid = false;
      } else if (formData.contrasena !== formData.confirmar_contrasena) {
        errors.confirmar_contrasena = 'Las contraseñas no coinciden';
        isValid = false;
      }
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

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Validación en tiempo real de la contraseña
    if (name === 'contrasena') {
      setPasswordValidation(validatePasswordRules(value));
      
      // Si hay confirmación de contraseña, validar que coincidan
      if (formData.confirmar_contrasena) {
        if (value !== formData.confirmar_contrasena) {
          setFormErrors(prev => ({
            ...prev,
            confirmar_contrasena: 'Las contraseñas no coinciden'
          }));
        } else {
          setFormErrors(prev => ({
            ...prev,
            confirmar_contrasena: ''
          }));
        }
      }
    }

    // Validar que las contraseñas coincidan en tiempo real
    if (name === 'confirmar_contrasena') {
      if (value !== formData.contrasena) {
        setFormErrors(prev => ({
          ...prev,
          confirmar_contrasena: 'Las contraseñas no coinciden'
        }));
      } else {
        setFormErrors(prev => ({
          ...prev,
          confirmar_contrasena: ''
        }));
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('La imagen no debe superar los 5MB');
        return;
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Solo se permiten archivos de imagen (JPG, PNG, GIF)');
        return;
      }

      setFormData(prev => ({
        ...prev,
        foto_perfil: file
      }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormErrors({
      nombre: '',
      apellido: '',
      nombre_usuario: '',
      correo: '',
      telefono: '',
      contrasena: '',
      confirmar_contrasena: ''
    });

    if (!validateForm()) {
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'foto_perfil' && formData[key] instanceof File) {
          formDataToSend.append('foto_perfil', formData[key]);
        } else if (key !== 'foto_perfil' && formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await axios.put(
        `http://localhost:3001/api/users/profile`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success || response.data.user) {
        setSuccess('Perfil actualizado exitosamente');
        
        // Actualizar el contexto de autenticación
        await checkAuth();
        
        // Actualizar el estado local
        if (response.data.user) {
          setUserData(response.data.user);
          if (response.data.user.foto_perfil) {
            const imageUrl = `http://localhost:3001/uploads/${response.data.user.foto_perfil}`;
            setPreviewUrl(imageUrl);
          }
        }
        
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al actualizar el perfil';
      setError(errorMessage);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '200px', // Asegura una altura mínima para el diálogo
        }
      }}
    >
      <DialogTitle>Mi Perfil</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '400px'
          }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ 
            p: 3, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '200px'
          }}>
            <Alert 
              severity="error" 
              sx={{ 
                width: '100%',
                '& .MuiAlert-message': {
                  width: '100%',
                  textAlign: 'center'
                }
              }}
            >
              {error}
            </Alert>
          </Box>
        ) : !userData ? (
          <Box sx={{ 
            p: 3, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '200px'
          }}>
            <Alert 
              severity="warning"
              sx={{ 
                width: '100%',
                '& .MuiAlert-message': {
                  width: '100%',
                  textAlign: 'center'
                }
              }}
            >
              No se encontró información del usuario
            </Alert>
          </Box>
        ) : (
          <Box component="form" noValidate sx={{ mt: 2 }}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 2 }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}
            {success && (
              <Alert 
                severity="success" 
                sx={{ mb: 2 }}
                onClose={() => setSuccess('')}
              >
                {success}
              </Alert>
            )}
            <Grid container spacing={2} alignItems="center" justifyContent="center">
              <Grid item xs={12} display="flex" justifyContent="center">
                <Box position="relative">
                  <Avatar
                    src={previewUrl}
                    sx={{ width: 100, height: 100, mb: 2 }}
                  />
                  <IconButton
                    color="primary"
                    aria-label="subir foto"
                    component="label"
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: -16,
                      backgroundColor: 'white',
                      '&:hover': { backgroundColor: '#f5f5f5' }
                    }}
                  >
                    <input
                      hidden
                      accept="image/*"
                      type="file"
                      onChange={handleFileChange}
                    />
                    <PhotoCamera />
                  </IconButton>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  required
                  label="Nombre"
                  name="nombre"
                  value={formData.nombre || ''}
                  onChange={handleChange}
                  error={!!formErrors.nombre}
                  helperText={formErrors.nombre}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  required
                  label="Apellido"
                  name="apellido"
                  value={formData.apellido || ''}
                  onChange={handleChange}
                  error={!!formErrors.apellido}
                  helperText={formErrors.apellido}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Correo Electrónico"
                  name="correo"
                  value={formData.correo || ''}
                  onChange={handleChange}
                  error={!!formErrors.correo}
                  helperText={formErrors.correo}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Nombre de Usuario"
                  name="nombre_usuario"
                  value={formData.nombre_usuario || ''}
                  onChange={handleChange}
                  error={!!formErrors.nombre_usuario}
                  helperText={formErrors.nombre_usuario}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="contrasena"
                  label="Nueva Contraseña"
                  type="password"
                  value={formData.contrasena || ''}
                  onChange={handleChange}
                  fullWidth
                  error={!!formErrors.contrasena}
                  helperText={
                    formErrors.contrasena || 
                    (formData.contrasena ? 
                      <Box>
                        <Typography variant="caption" color={passwordValidation.length ? "success.main" : "error.main"}>
                          ✓ Entre 8 y 20 caracteres
                        </Typography>
                        <br />
                        <Typography variant="caption" color={passwordValidation.uppercase ? "success.main" : "error.main"}>
                          ✓ Al menos una mayúscula
                        </Typography>
                        <br />
                        <Typography variant="caption" color={passwordValidation.lowercase ? "success.main" : "error.main"}>
                          ✓ Al menos una minúscula
                        </Typography>
                        <br />
                        <Typography variant="caption" color={passwordValidation.number ? "success.main" : "error.main"}>
                          ✓ Al menos un número
                        </Typography>
                      </Box>
                      : 
                      "La contraseña debe tener entre 8 y 20 caracteres, una mayúscula, una minúscula y un número"
                    )
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="confirmar_contrasena"
                  label="Confirmar Nueva Contraseña"
                  type="password"
                  value={formData.confirmar_contrasena || ''}
                  onChange={handleChange}
                  fullWidth
                  required={!!formData.contrasena}
                  error={!!formErrors.confirmar_contrasena}
                  helperText={formErrors.confirmar_contrasena}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Provincia"
                  name="provincia"
                  value={formData.provincia || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Cantón"
                  name="canton"
                  value={formData.canton || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dirección"
                  name="direccion"
                  value={formData.direccion || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  name="telefono"
                  value={formData.telefono || ''}
                  onChange={handleChange}
                  error={!!formErrors.telefono}
                  helperText={formErrors.telefono}
                  placeholder="Ingrese un número de teléfono de 8 a 10 dígitos"
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      {!loading && !error && userData && (
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{
              bgcolor: '#1e3a5f',
              '&:hover': {
                bgcolor: '#2c5282'
              }
            }}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default Profile; 