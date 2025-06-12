import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  IconButton,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  FormHelperText,
  Tabs,
  Tab
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const UserManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  const initialFormData = {
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
    rol_id: '',
    estado: 'activo'
  };

  const [formData, setFormData] = useState(initialFormData);
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
    contrasena: '',
    rol_id: ''
  });

  const token = localStorage.getItem('token');
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const response = await axios.get('http://localhost:3001/api/users', axiosConfig);
      console.log('Users response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.error('Invalid users data format:', response.data);
        setError('Error: Formato de respuesta de usuarios inválido');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      const errorMessage = error.response?.data?.message || 'Error al cargar usuarios';
      setError(errorMessage);
    }
  };

  const fetchRoles = async () => {
    try {
      console.log('Fetching roles...');
      const response = await axios.get('http://localhost:3001/api/users/roles', axiosConfig);
      console.log('Roles response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setRoles(response.data);
      } else {
        console.error('Invalid roles data format:', response.data);
        setError('Error: Formato de respuesta de roles inválido');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      const errorMessage = error.response?.data?.message || 'Error al cargar roles';
      setError(errorMessage);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Limpiar errores cuando el usuario empieza a escribir
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

  const handleOpenDialog = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        ...Object.keys(user).reduce((acc, key) => {
          acc[key] = user[key] === null ? '' : user[key];
          return acc;
        }, {}),
        contrasena: '',
        confirmar_contrasena: ''
      });
    } else {
      setSelectedUser(null);
      setFormData(initialFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setFormData(initialFormData);
    setError('');
  };

  const validateForm = () => {
    const newErrors = {
      nombre: '',
      apellido: '',
      nombre_usuario: '',
      correo: '',
      contrasena: '',
      confirmar_contrasena: '',
      rol_id: ''
    };
    let hasErrors = false;

    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
      hasErrors = true;
    }

    if (!formData.apellido?.trim()) {
      newErrors.apellido = 'El apellido es obligatorio';
      hasErrors = true;
    }

    if (!formData.nombre_usuario?.trim()) {
      newErrors.nombre_usuario = 'El nombre de usuario es obligatorio';
      hasErrors = true;
    }

    if (!formData.correo?.trim()) {
      newErrors.correo = 'El correo electrónico es obligatorio';
      hasErrors = true;
    } else {
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRegex.test(formData.correo)) {
        newErrors.correo = 'El formato del correo electrónico no es válido';
        hasErrors = true;
      }
    }

    if (!formData.rol_id) {
      newErrors.rol_id = 'El rol es obligatorio';
      hasErrors = true;
    }

    // Validación de contraseña para nuevos usuarios
    if (!selectedUser) {
      if (!formData.contrasena) {
        newErrors.contrasena = 'La contraseña es obligatoria para nuevos usuarios';
        hasErrors = true;
      }
      if (!formData.confirmar_contrasena) {
        newErrors.confirmar_contrasena = 'Debe confirmar la contraseña';
        hasErrors = true;
      }
    }

    // Si hay contraseña (nueva o modificación), validar confirmación
    if (formData.contrasena) {
      const validation = validatePasswordRules(formData.contrasena);
      if (!validation.length) {
        newErrors.contrasena = 'La contraseña debe tener entre 8 y 20 caracteres';
        hasErrors = true;
      }
      if (!validation.uppercase) {
        newErrors.contrasena = 'La contraseña debe contener al menos una letra mayúscula';
        hasErrors = true;
      }
      if (!validation.lowercase) {
        newErrors.contrasena = 'La contraseña debe contener al menos una letra minúscula';
        hasErrors = true;
      }
      if (!validation.number) {
        newErrors.contrasena = 'La contraseña debe contener al menos un número';
        hasErrors = true;
      }
      if (!formData.confirmar_contrasena) {
        newErrors.confirmar_contrasena = 'Debe confirmar la contraseña';
        hasErrors = true;
      } else if (formData.contrasena !== formData.confirmar_contrasena) {
        newErrors.confirmar_contrasena = 'Las contraseñas no coinciden';
        hasErrors = true;
      }
    }

    setFormErrors(newErrors);
    return !hasErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      // Hacer scroll al primer campo con error
      const firstErrorField = Object.keys(formErrors).find(key => formErrors[key]);
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    try {
      if (selectedUser) {
        await axios.put(
          `http://localhost:3001/api/users/${selectedUser.id}`,
          formData,
          axiosConfig
        );
        setSuccess('Usuario actualizado exitosamente');
      } else {
        await axios.post('http://localhost:3001/api/users', formData, axiosConfig);
        setSuccess('Usuario creado exitosamente');
      }
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      const errorResponse = error.response?.data;
      const errorMessage = errorResponse?.message || '';
      
      // Limpiar errores previos
      const newErrors = { ...formErrors };

      // Verificar si el error es específicamente sobre correo duplicado
      if (errorResponse?.code === 'EMAIL_DUPLICATE' || errorMessage.toLowerCase().includes('correo electrónico ya existe')) {
        newErrors.correo = 'Este correo electrónico ya está registrado en el sistema';
        const element = document.querySelector('[name="correo"]');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      // Verificar si el error es específicamente sobre usuario duplicado
      else if (errorResponse?.code === 'USERNAME_DUPLICATE' || errorMessage.toLowerCase().includes('nombre de usuario ya existe')) {
        newErrors.nombre_usuario = 'Este nombre de usuario ya está registrado en el sistema';
        const element = document.querySelector('[name="nombre_usuario"]');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      else if (errorMessage.toLowerCase().includes('teléfono')) {
        newErrors.telefono = 'El formato del número de teléfono no es válido';
      } else {
        setError(errorMessage || 'Error al guardar el usuario');
      }

      setFormErrors(newErrors);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea desactivar este usuario?')) {
      try {
        const response = await axios.delete(
          `http://localhost:3001/api/users/${id}`,
          axiosConfig
        );
        setSuccess(response.data.message);
        // Actualizar el usuario en la lista local
        setUsers(users.map(user => 
          user.id === id 
            ? { ...user, estado: 'inactivo' }
            : user
        ));
      } catch (error) {
        setError('Error al desactivar usuario');
      }
    }
  };

  const handleRoleChange = (event, newValue) => {
    setSelectedRole(newValue);
  };

  const getUsersByRole = (role) => {
    console.log('getUsersByRole - Input role:', role);
    console.log('getUsersByRole - Current users:', users);
    
    if (role === 'all') {
      return users;
    }

    const filteredUsers = users.filter(user => {
      const userRole = user.rol_nombre?.toLowerCase() || user.rol?.toLowerCase();
      const targetRole = role.toLowerCase();
      console.log('Comparing roles:', { userRole, targetRole, user });
      return userRole === targetRole;
    });

    console.log('getUsersByRole - Filtered users:', filteredUsers);
    return filteredUsers;
  };

  const renderUserTable = (roleUsers, roleName) => {
    console.log('renderUserTable - Role users:', roleUsers);
    console.log('renderUserTable - Role name:', roleName);

    if (!roleUsers || roleUsers.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No hay usuarios con el rol de {roleName}
          </Typography>
        </Box>
      );
    }

    return (
      <TableContainer
        component={Paper}
        sx={{ 
          overflowX: 'auto',
          mb: 3,
          '& .MuiTable-root': {
            minWidth: { xs: 'auto', sm: 650 }
          }
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              {!isMobile && <TableCell>Correo</TableCell>}
              <TableCell>Rol</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roleUsers.map((user) => (
              <TableRow 
                key={user.id}
                sx={{
                  backgroundColor: user.estado === 'inactivo' ? '#f5f5f5' : 'inherit',
                  '& > *': { color: user.estado === 'inactivo' ? '#666' : 'inherit' }
                }}
              >
                <TableCell>{`${user.nombre} ${user.apellido}`}</TableCell>
                {!isMobile && <TableCell>{user.correo}</TableCell>}
                <TableCell>{user.rol_nombre || user.rol}</TableCell>
                <TableCell>
                  <Box
                    component="span"
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      backgroundColor: user.estado === 'activo' ? '#e8f5e9' : '#ffebee',
                      color: user.estado === 'activo' ? '#2e7d32' : '#c62828',
                      fontSize: '0.875rem'
                    }}
                  >
                    {user.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(user)}
                    size={isMobile ? "small" : "medium"}
                  >
                    <EditIcon />
                  </IconButton>
                  {user.estado === 'activo' && (
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(user.id)}
                      size={isMobile ? "small" : "medium"}
                      title="Desactivar usuario"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'center' }} 
        mb={3}
        gap={2}
      >
        <Typography variant="h4" component="h1">
          Gestión de Usuarios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            bgcolor: '#1e3a5f', 
            '&:hover': { bgcolor: '#2c5282' },
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          Nuevo Usuario
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={selectedRole} 
          onChange={handleRoleChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Todos" value="all" />
          {roles.map((role) => (
            <Tab 
              key={role.id} 
              label={role.nombre} 
              value={role.nombre.toLowerCase()} 
            />
          ))}
        </Tabs>
      </Box>

      {selectedRole === 'all' ? (
        roles.map((role) => (
          <Box key={role.id} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1e3a5f' }}>
              {role.nombre}
            </Typography>
            {renderUserTable(getUsersByRole(role.nombre), role.nombre)}
          </Box>
        ))
      ) : (
        renderUserTable(getUsersByRole(selectedRole), selectedRole)
      )}

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        </DialogTitle>
        <DialogContent>
          <Box 
            component="form" 
            noValidate 
            sx={{ 
              mt: 2,
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)'
              }
            }}
          >
            {(error || success) && (
              <Box sx={{ gridColumn: '1 / -1' }}>
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
              </Box>
            )}
            <TextField
              required
              name="nombre"
              label="Nombre"
              value={formData.nombre || ''}
              onChange={handleChange}
              fullWidth
              error={!!formErrors.nombre}
              helperText={formErrors.nombre}
            />
            <TextField
              required
              name="apellido"
              label="Apellido"
              value={formData.apellido || ''}
              onChange={handleChange}
              fullWidth
              error={!!formErrors.apellido}
              helperText={formErrors.apellido}
            />
            <TextField
              required
              name="nombre_usuario"
              label="Nombre de Usuario"
              value={formData.nombre_usuario || ''}
              onChange={handleChange}
              fullWidth
              error={!!formErrors.nombre_usuario}
              helperText={formErrors.nombre_usuario}
            />
            <TextField
              required
              name="correo"
              label="Correo Electrónico"
              type="email"
              value={formData.correo || ''}
              onChange={handleChange}
              fullWidth
              error={!!formErrors.correo}
              helperText={formErrors.correo}
            />
            <TextField
              name="contrasena"
              label={selectedUser ? "Nueva Contraseña" : "Contraseña"}
              type="password"
              value={formData.contrasena || ''}
              onChange={handleChange}
              fullWidth
              required={!selectedUser}
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
            <TextField
              name="confirmar_contrasena"
              label={selectedUser ? "Confirmar Nueva Contraseña" : "Confirmar Contraseña"}
              type="password"
              value={formData.confirmar_contrasena || ''}
              onChange={handleChange}
              fullWidth
              required={!selectedUser || formData.contrasena}
              error={!!formErrors.confirmar_contrasena}
              helperText={formErrors.confirmar_contrasena}
            />
            <FormControl fullWidth required error={!!formErrors.rol_id}>
              <InputLabel>Rol</InputLabel>
              <Select
                name="rol_id"
                value={formData.rol_id || ''}
                onChange={handleChange}
                label="Rol"
              >
                {roles.map((rol) => (
                  <MenuItem key={rol.id} value={rol.id}>
                    {rol.nombre}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.rol_id && (
                <FormHelperText error>{formErrors.rol_id}</FormHelperText>
              )}
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                name="estado"
                value={formData.estado || 'activo'}
                onChange={handleChange}
                label="Estado"
              >
                <MenuItem value="activo">Activo</MenuItem>
                <MenuItem value="inactivo">Inactivo</MenuItem>
              </Select>
            </FormControl>
            <TextField
              name="provincia"
              label="Provincia"
              value={formData.provincia || ''}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              name="canton"
              label="Cantón"
              value={formData.canton || ''}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              name="direccion"
              label="Dirección"
              value={formData.direccion || ''}
              onChange={handleChange}
              fullWidth
              sx={{ gridColumn: { sm: '1 / -1' } }}
            />
            <TextField
              name="telefono"
              label="Teléfono"
              value={formData.telefono || ''}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              name="cargo"
              label="Cargo"
              value={formData.cargo || ''}
              onChange={handleChange}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{ width: isMobile ? '100%' : 'auto' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{ 
              width: isMobile ? '100%' : 'auto',
              bgcolor: '#1e3a5f', 
              '&:hover': { bgcolor: '#2c5282' }
            }}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 