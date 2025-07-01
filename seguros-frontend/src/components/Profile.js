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
import CloseIcon from '@mui/icons-material/Close';

const Profile = ({ open, onClose }) => {
  const { user: authUser, checkAuth, updateUserProfile } = useAuth();
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
      console.log('Profile - Fetching user data for ID:', authUser.id);
      
      const response = await axios.get(
        `http://localhost:3006/api/users/${authUser.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      console.log('Profile - User data response:', response.data);
      
      if (response.data && response.data.success && response.data.user) {
        const userData = response.data.user;
        setUserData(userData);
        setFormData({
          nombre: userData.nombre || '',
          apellido: userData.apellido || '',
          nombre_usuario: userData.nombre_usuario || '',
          correo: userData.correo || '',
          provincia: userData.provincia || '',
          canton: userData.canton || '',
          direccion: userData.direccion || '',
          telefono: userData.telefono || '',
          cargo: userData.cargo || '',
          foto_perfil: userData.foto_perfil || null
        });
        if (userData.foto_perfil) {
          setPreviewUrl(`http://localhost:3006/uploads/${userData.foto_perfil}?t=${new Date().getTime()}`);
        }
      } else {
        throw new Error('No se pudo obtener la información del usuario');
      }
    } catch (error) {
      console.error('Profile - Error fetching user data:', error);
      setError(error.response?.data?.message || 'Error al cargar los datos del usuario');
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
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess('');

      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await axios.put(
        'http://localhost:3006/api/users/profile',
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setSuccess('Perfil actualizado exitosamente');
        // Actualizar el contexto con los nuevos datos del usuario
        updateUserProfile(response.data.user);
        // Recargar los datos del usuario
        await fetchUserData();
      } else {
        throw new Error(response.data.message || 'Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6" component="div" sx={{ color: '#1e3a5f', fontWeight: 600 }}>
          Perfil de Usuario
        </Typography>
      </DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setError(null)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 2 }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setSuccess(null)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            {success}
          </Alert>
        )}

        {!userData && (
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
        )}

        {userData && (
          <Box component="form" noValidate sx={{ mt: 2 }}>
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