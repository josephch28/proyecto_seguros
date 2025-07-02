import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Container,
  Chip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../config';

// Configurar axios
axios.defaults.baseURL = API_URL.replace('/api', '');
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Accept'] = 'application/json';

const InsuranceManagement = () => {
  const [insurances, setInsurances] = useState([]);
  const [types, setTypes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    tipo_seguro_id: '',
    descripcion: '',
    porcentaje_cobertura: '',
    monto_cobertura: '',
    beneficios: '',
    requisitos: '',
    precio_base: '',
    estado: 'activo'
  });

  useEffect(() => {
    fetchInsurances();
    fetchTypes();
  }, []);

  const fetchInsurances = async () => {
    try {
      const response = await axios.get('/api/seguros');
      setInsurances(response.data);
    } catch (error) {
      setError('Error al cargar los seguros');
    }
  };

  const fetchTypes = async () => {
    setLoadingTypes(true);
    try {
      const response = await axios.get('/api/seguros/tipos');
      // Mostrar todos los tipos activos
      setTypes(response.data);
    } catch (error) {
      console.error('Error al cargar tipos:', error);
      setError('Error al cargar los tipos de seguro');
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleOpenDialog = (insurance = null) => {
    if (insurance) {
      console.log('Abriendo diálogo para editar seguro:', insurance);
      setSelectedInsurance(insurance);
      
      // Convertir los datos del backend al formato del formulario
      const tipoSeguroId = insurance.tipo_seguro_id;
      const montoCobertura = insurance.tipo_seguro_id === 1 ? insurance.porcentaje_cobertura : '';
      const porcentajeCobertura = insurance.tipo_seguro_id === 2 ? insurance.porcentaje_cobertura : '';

      setFormData({
        nombre: insurance.nombre || '',
        tipo_seguro_id: tipoSeguroId,
        descripcion: insurance.descripcion || '',
        porcentaje_cobertura: porcentajeCobertura,
        monto_cobertura: montoCobertura,
        beneficios: insurance.beneficios || '',
        requisitos: insurance.requisitos || '',
        precio_base: insurance.precio_base || '',
        estado: insurance.estado || 'activo'
      });
    } else {
      setSelectedInsurance(null);
      setFormData({
        nombre: '',
        tipo_seguro_id: '',
        descripcion: '',
        porcentaje_cobertura: '',
        monto_cobertura: '',
        beneficios: '',
        requisitos: '',
        precio_base: '',
        estado: 'activo'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInsurance(null);
    setFormData({
      nombre: '',
      tipo_seguro_id: '',
      descripcion: '',
      porcentaje_cobertura: '',
      monto_cobertura: '',
      beneficios: '',
      requisitos: '',
      precio_base: '',
      estado: 'activo'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Si se cambia el tipo de seguro, limpiar los campos de cobertura
    if (name === 'tipo_seguro_id') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        porcentaje_cobertura: '',
        monto_cobertura: ''
      }));
      return;
    }

    // Validar que el precio base no sea negativo
    if (name === 'precio_base' && value < 0) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      // Obtener el token del localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay sesión activa. Por favor, inicie sesión.');
        return;
      }

      // Validar campos requeridos
      if (!formData.nombre || !formData.tipo_seguro_id || !formData.descripcion || 
          !formData.beneficios || !formData.requisitos || !formData.precio_base) {
        setError('Todos los campos son requeridos');
        return;
      }

      // Determinar el tipo y cobertura basado en tipo_seguro_id
      const tipo = formData.tipo_seguro_id === 1 ? 'vida' : 'medico';
      const cobertura = tipo === 'vida' ? formData.monto_cobertura : formData.porcentaje_cobertura;

      // Validar que la cobertura sea un número válido
      if (isNaN(cobertura) || cobertura <= 0) {
        setError(`La cobertura debe ser un número válido mayor a 0`);
        return;
      }

      // Validar cobertura según el tipo
      if (tipo === 'medico' && (cobertura < 0 || cobertura > 100)) {
        setError('La cobertura para seguros médicos debe ser un porcentaje entre 0 y 100');
        return;
      }

      // Preparar los datos para enviar
      const submitData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        tipo: tipo,
        cobertura: parseFloat(cobertura).toFixed(2),
        beneficios: formData.beneficios.trim(),
        requisitos: formData.requisitos.trim(),
        precio_base: parseFloat(formData.precio_base).toFixed(2),
        estado: formData.estado || 'activo'
      };

      // Validar que ningún campo sea undefined o null
      for (const [key, value] of Object.entries(submitData)) {
        if (value === undefined || value === null || value === '') {
          setError(`El campo ${key} no puede estar vacío`);
          return;
        }
      }

      console.log('Datos a enviar:', submitData);

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      let response;
      if (selectedInsurance) {
        console.log('Actualizando seguro existente:', selectedInsurance.id);
        response = await axios.put(
          `/api/seguros/${selectedInsurance.id}`,
          submitData,
          config
        );
      } else {
        console.log('Creando nuevo seguro');
        response = await axios.post(
          '/api/seguros',
          submitData,
          config
        );
      }

      console.log('Respuesta del servidor:', response.data);

      if (response.data.success) {
        setError(null);
        handleCloseDialog();
        fetchInsurances();
      } else {
        setError(response.data.message || 'Error al guardar el seguro');
      }
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Datos del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError(error.response?.data?.message || 'Error al guardar el seguro');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este seguro?')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No hay sesión activa. Por favor, inicie sesión.');
          return;
        }

        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };

        await axios.delete(`/api/seguros/${id}`, config);
        setSuccessMessage('Seguro eliminado exitosamente');
        fetchInsurances();
      } catch (error) {
        if (error.response?.status === 401) {
          setError('Sesión expirada. Por favor, inicie sesión nuevamente.');
        } else {
          setError('Error al eliminar el seguro');
        }
      }
    }
  };

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Gestión de Seguros
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Seguro
        </Button>
      </Box>

      {/* Tabla de Seguros */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Cobertura</TableCell>
                <TableCell>Precio Base</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {insurances.map((insurance) => (
                <TableRow key={insurance.id}>
                  <TableCell>{insurance.nombre}</TableCell>
                  <TableCell>{insurance.tipo_seguro_id === 2 ? 'Médico' : 'Vida'}</TableCell>
                  <TableCell>
                    {insurance.tipo_seguro_id === 2 
                      ? `${insurance.porcentaje_cobertura}%` 
                      : `$${insurance.monto_cobertura}`}
                  </TableCell>
                  <TableCell>${insurance.precio_base}</TableCell>
                  <TableCell>
                    <Chip
                      label={insurance.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      color={insurance.estado === 'activo' ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(insurance)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(insurance.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Diálogo de Formulario */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedInsurance ? 'Editar Seguro' : 'Nuevo Seguro'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Seguro</InputLabel>
                <Select
                  name="tipo_seguro_id"
                  value={formData.tipo_seguro_id}
                  onChange={handleInputChange}
                  required
                >
                  {types.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                multiline
                rows={3}
                required
              />
            </Grid>
            {formData.tipo_seguro_id === 2 && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Porcentaje de Cobertura (%)"
                  name="porcentaje_cobertura"
                  type="number"
                  value={formData.porcentaje_cobertura}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    inputProps: { 
                      min: 0,
                      max: 100,
                      step: 1
                    }
                  }}
                  helperText="Ingrese el porcentaje de gastos médicos que se cubrirá"
                />
              </Grid>
            )}
            {formData.tipo_seguro_id === 1 && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Monto de Cobertura ($)"
                  name="monto_cobertura"
                  type="number"
                  value={formData.monto_cobertura}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    inputProps: { 
                      min: 0,
                      step: 0.01
                    }
                  }}
                  helperText="Ingrese el monto que se pagará en caso de fallecimiento"
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Precio Base"
                name="precio_base"
                type="number"
                value={formData.precio_base}
                onChange={handleInputChange}
                required
                InputProps={{
                  inputProps: { 
                    min: 0,
                    step: 0.01
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="activo">Activo</MenuItem>
                  <MenuItem value="inactivo">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Beneficios"
                name="beneficios"
                value={formData.beneficios}
                onChange={handleInputChange}
                multiline
                rows={3}
                required
                helperText="Ingrese los beneficios del seguro, separados por comas"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Requisitos"
                name="requisitos"
                value={formData.requisitos}
                onChange={handleInputChange}
                multiline
                rows={3}
                required
                helperText="Ingrese los requisitos del seguro, separados por comas"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? 'Guardando...' : selectedInsurance ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error || !!successMessage}
        autoHideDuration={6000}
        onClose={() => {
          setError('');
          setSuccessMessage('');
        }}
      >
        <Alert
          onClose={() => {
            setError('');
            setSuccessMessage('');
          }}
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {error || successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default InsuranceManagement; 