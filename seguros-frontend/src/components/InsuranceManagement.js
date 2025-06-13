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
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: '',
    cobertura: '',
    beneficios: '',
    requisitos: '',
    precio_base: '',
    duracion_meses: '',
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
        tipo: insurance.tipo,
        descripcion: insurance.descripcion,
        cobertura: insurance.cobertura,
        beneficios: insurance.beneficios,
        requisitos: insurance.requisitos,
        precio_base: insurance.precio_base,
        duracion_meses: insurance.duracion_meses,
        estado: insurance.estado
      });
    } else {
      setSelectedInsurance(null);
      setFormData({
        nombre: '',
        tipo: '',
        descripcion: '',
        cobertura: '',
        beneficios: '',
        requisitos: '',
        precio_base: '',
        duracion_meses: '',
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
      tipo: '',
      descripcion: '',
      cobertura: '',
      beneficios: '',
      requisitos: '',
      precio_base: '',
      duracion_meses: '',
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
        setSuccessMessage('Seguro actualizado exitosamente');
      } else {
        await axios.post('/api/seguros', formData, config);
        setSuccessMessage('Seguro creado exitosamente');
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
                <TableCell>Duración</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {insurances.map((insurance) => (
              <TableRow key={insurance.id}>
                <TableCell>{insurance.nombre}</TableCell>
                  <TableCell>{insurance.tipo === 'medico' ? 'Médico' : 'Vida'}</TableCell>
                <TableCell>
                    {insurance.tipo === 'medico' 
                      ? `${insurance.cobertura}%` 
                      : `$${insurance.cobertura}`}
                </TableCell>
                <TableCell>${insurance.precio_base}</TableCell>
                  <TableCell>{insurance.duracion_meses} meses</TableCell>
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
              <TextField
                fullWidth
                label="Tipo"
                name="tipo"
                select
                value={formData.tipo}
                  onChange={handleInputChange}
                  required
              >
                <MenuItem value="medico">Médico</MenuItem>
                <MenuItem value="vida">Vida</MenuItem>
              </TextField>
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={formData.tipo === 'medico' ? 'Porcentaje de Cobertura (%)' : 'Monto de Cobertura ($)'}
                name="cobertura"
                type="number"
                value={formData.cobertura}
                onChange={handleInputChange}
                required
                InputProps={{
                  inputProps: { 
                    min: 0,
                    max: formData.tipo === 'medico' ? 100 : undefined,
                    step: formData.tipo === 'medico' ? 1 : 0.01
                  }
                }}
                helperText={formData.tipo === 'medico' ? 'Ingrese el porcentaje de gastos médicos que se cubrirá' : 'Ingrese el monto que se pagará en caso de fallecimiento'}
              />
            </Grid>
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
              <TextField
                fullWidth
                label="Duración (meses)"
                name="duracion_meses"
                type="number"
                value={formData.duracion_meses}
                onChange={handleInputChange}
                required
                InputProps={{
                  inputProps: { 
                    min: 1,
                    step: 1
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estado"
                  name="estado"
                select
                  value={formData.estado}
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="activo">Activo</MenuItem>
                  <MenuItem value="inactivo">Inactivo</MenuItem>
              </TextField>
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