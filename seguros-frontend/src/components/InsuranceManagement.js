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
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

// Configurar axios
axios.defaults.baseURL = 'http://localhost:3001';
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
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    tipo_seguro_id: '',
    descripcion: '',
    cobertura: '',
    beneficios: '',
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
      setSelectedInsurance(insurance);
      setFormData({
        nombre: insurance.nombre,
        tipo_seguro_id: insurance.tipo_seguro_id,
        descripcion: insurance.descripcion,
        cobertura: insurance.cobertura,
        beneficios: insurance.beneficios,
        precio_base: insurance.precio_base,
        estado: insurance.estado
      });
    } else {
      setSelectedInsurance(null);
      setFormData({
        nombre: '',
        tipo_seguro_id: '',
        descripcion: '',
        cobertura: '',
        beneficios: '',
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
      cobertura: '',
      beneficios: '',
      precio_base: '',
      estado: 'activo'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validar que el precio base no sea negativo
    if (name === 'precio_base' && value < 0) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Obtener el token del localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay sesión activa. Por favor, inicie sesión.');
        return;
      }

      // Configurar el token en el header
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      if (selectedInsurance) {
        await axios.put(`/api/seguros/${selectedInsurance.id}`, formData, config);
        setSuccess('Seguro actualizado exitosamente');
      } else {
        await axios.post('/api/seguros', formData, config);
        setSuccess('Seguro creado exitosamente');
      }
      handleCloseDialog();
      fetchInsurances();
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Sesión expirada. Por favor, inicie sesión nuevamente.');
      } else {
        setError(error.response?.data?.message || 'Error al procesar el seguro');
      }
    } finally {
      setLoading(false);
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
        setSuccess('Seguro eliminado exitosamente');
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Gestión de Seguros</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenDialog()}
        >
          Nuevo Seguro
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Descripción</TableCell>
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
                <TableCell>
                  {types.find(t => t.id === insurance.tipo_seguro_id)?.nombre || 'N/A'}
                </TableCell>
                <TableCell>{insurance.descripcion}</TableCell>
                <TableCell>{insurance.cobertura}</TableCell>
                <TableCell>${insurance.precio_base}</TableCell>
                <TableCell>{insurance.estado}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(insurance)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(insurance.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedInsurance ? 'Editar Seguro' : 'Nuevo Seguro'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="nombre"
                label="Nombre del Seguro"
                value={formData.nombre}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Seguro</InputLabel>
                <Select
                  name="tipo_seguro_id"
                  value={formData.tipo_seguro_id}
                  onChange={handleInputChange}
                  label="Tipo de Seguro"
                  required
                  disabled={loadingTypes}
                >
                  {loadingTypes ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Cargando tipos...
                    </MenuItem>
                  ) : types.length === 0 ? (
                    <MenuItem disabled>No hay tipos disponibles</MenuItem>
                  ) : (
                    types.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.nombre}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="descripcion"
                label="Descripción"
                value={formData.descripcion}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="cobertura"
                label="Cobertura"
                value={formData.cobertura}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="beneficios"
                label="Beneficios"
                value={formData.beneficios}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                name="precio_base"
                label="Precio Base"
                value={formData.precio_base}
                onChange={handleInputChange}
                required
                inputProps={{ min: 0 }}
                error={formData.precio_base < 0}
                helperText={formData.precio_base < 0 ? "El precio no puede ser negativo" : ""}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  label="Estado"
                  required
                >
                  <MenuItem value="activo">Activo</MenuItem>
                  <MenuItem value="inactivo">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading || loadingTypes}
          >
            {loading ? 'Procesando...' : selectedInsurance ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InsuranceManagement; 