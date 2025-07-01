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
  Chip
} from '@mui/material';
import { Edit as EditIcon, Visibility as VisibilityIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const tipoGastoOptions = {
  vida: [{ value: 'mortuorio', label: 'Mortuorio' }],
  salud: [
    { value: 'hospitalizacion', label: 'Hospitalización' },
    { value: 'medicinas', label: 'Medicinas' }
  ]
};

const ReimbursementManagement = () => {
  const { user } = useAuth();
  const [reembolsos, setReembolsos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [contratosFiltrados, setContratosFiltrados] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReembolso, setSelectedReembolso] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    cliente_id: '',
    contrato_id: '',
    fecha_evento: '',
    tipo_gasto: '',
    monto: '',
    descripcion: ''
  });
  const [comprobanteUrl, setComprobanteUrl] = useState('');

  useEffect(() => {
    fetchReembolsos();
    if (user?.rol_nombre === 'agente') fetchClientes();
    fetchContratos();
  }, [user]);

  useEffect(() => {
    if (user?.rol_nombre === 'cliente') {
      setFormData((prev) => ({ ...prev, cliente_id: user.cliente_id }));
    }
  }, [user]);

  useEffect(() => {
    // Filtrar contratos por cliente seleccionado (solo para agente) y solo activos
    if (user?.rol_nombre === 'agente' && formData.cliente_id) {
      setContratosFiltrados(contratos.filter(c => c.cliente_id === formData.cliente_id && c.estado === 'activo'));
    } else if (user?.rol_nombre === 'cliente') {
      setContratosFiltrados(contratos.filter(c => c.estado === 'activo'));
    } else {
      setContratosFiltrados([]);
    }
  }, [formData.cliente_id, contratos, user]);

  const fetchReembolsos = async () => {
    try {
      const res = await API.get('/reembolsos');
      setReembolsos(res.data);
    } catch (err) {
      setError('Error al cargar los reembolsos');
    }
  };

  const fetchClientes = async () => {
    try {
      const res = await API.get('/users/clientes');
      setClientes(res.data.data || res.data);
    } catch (err) {
      setError('Error al cargar los clientes');
    }
  };

  const fetchContratos = async () => {
    try {
      let url = '/contratos';
      if (user?.rol_nombre === 'cliente') url = '/contratos/mis-contratos';
      const res = await API.get(url);
      setContratos(res.data.data || res.data);
    } catch (err) {
      setError('Error al cargar los contratos');
    }
  };

  const handleOpenDialog = (reembolso = null) => {
    setFile(null);
    setComprobanteUrl('');
    if (reembolso) {
      setSelectedReembolso(reembolso);
      setFormData({
        cliente_id: reembolso.cliente_id,
        contrato_id: reembolso.contrato_id,
        fecha_evento: reembolso.fecha_evento?.split('T')[0] || '',
        tipo_gasto: reembolso.tipo_gasto,
        monto: reembolso.monto,
        descripcion: reembolso.descripcion
      });
      setComprobanteUrl(reembolso.archivo_comprobante ? `/api/reembolsos/${reembolso.id}/comprobante` : '');
    } else {
      setSelectedReembolso(null);
      setFormData({
        cliente_id: user?.cliente_id || '',
        contrato_id: '',
        fecha_evento: '',
        tipo_gasto: '',
        monto: '',
        descripcion: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedReembolso(null);
    setFormData({
      cliente_id: user?.cliente_id || '',
      contrato_id: '',
      fecha_evento: '',
      tipo_gasto: '',
      monto: '',
      descripcion: ''
    });
    setFile(null);
    setComprobanteUrl('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'cliente_id') setFormData(prev => ({ ...prev, contrato_id: '', tipo_gasto: '' }));
    if (name === 'contrato_id') setFormData(prev => ({ ...prev, tipo_gasto: '' }));
  };

  const handleContratoChange = (e) => {
    const contrato_id = e.target.value;
    setFormData(prev => ({ ...prev, contrato_id, tipo_gasto: '' }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const getTipoSeguroContrato = (contrato_id) => {
    const contrato = contratos.find(c => c.id === Number(contrato_id));
    if (!contrato) return null;
    const tipo = (contrato.tipo_seguro_nombre || contrato.tipo_seguro || '').toLowerCase();
    if (tipo.includes('vida')) return 'vida';
    if (tipo.includes('salud') || tipo.includes('médico')) return 'salud';
    return null;
  };

  const getTipoGastoOptions = () => {
    const tipo = getTipoSeguroContrato(formData.contrato_id);
    return tipo ? tipoGastoOptions[tipo] : [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validar que haya archivo
      if (!file) {
        setError('El comprobante es obligatorio');
        setLoading(false);
        return;
      }
      // Crear FormData con todos los campos y el archivo
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      data.append('comprobante', file);

      // Crear reembolso y subir comprobante en una sola petición
      await API.post('/reembolsos', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess('Reembolso creado exitosamente');
      handleCloseDialog();
      fetchReembolsos();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar el reembolso');
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async (id) => {
    try {
      await API.patch(`/reembolsos/${id}/estado`, { estado: 'aprobado' });
      setSuccess('Reembolso aprobado');
      fetchReembolsos();
    } catch (err) {
      setError('Error al aprobar el reembolso');
    }
  };

  const handleRechazar = async (id) => {
    try {
      await API.patch(`/reembolsos/${id}/estado`, { estado: 'rechazado' });
      setSuccess('Reembolso rechazado');
      fetchReembolsos();
    } catch (err) {
      setError('Error al rechazar el reembolso');
    }
  };

  const handleViewComprobante = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reembolsos/${id}/comprobante`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('No se pudo obtener el comprobante');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      setError('No se pudo visualizar el comprobante');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Gestión de Reembolsos</Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>Nuevo Caso</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Contrato</TableCell>
              <TableCell>Fecha Evento</TableCell>
              <TableCell>Tipo Gasto</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Comprobante</TableCell>
              {user?.rol_nombre === 'agente' && <TableCell>Acciones</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {reembolsos.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.cliente_nombre || '-'}</TableCell>
                <TableCell>{r.numero_contrato || r.contrato_id}</TableCell>
                <TableCell>{r.fecha_evento ? new Date(r.fecha_evento).toLocaleDateString() : '-'}</TableCell>
                <TableCell>{r.tipo_gasto}</TableCell>
                <TableCell>${r.monto}</TableCell>
                <TableCell>
                  <Chip label={r.estado} color={r.estado === 'aprobado' ? 'success' : r.estado === 'rechazado' ? 'error' : 'warning'} size="small" />
                </TableCell>
                <TableCell>
                  {r.archivo_comprobante ? (
                    <IconButton onClick={() => handleViewComprobante(r.id)}>
                      <VisibilityIcon />
                    </IconButton>
                  ) : 'No subido'}
                </TableCell>
                {user?.rol_nombre === 'agente' && (
                  <TableCell>
                    {r.estado === 'pendiente' && (
                      <>
                        <IconButton onClick={() => handleAprobar(r.id)} color="success"><CheckIcon /></IconButton>
                        <IconButton onClick={() => handleRechazar(r.id)} color="error"><CloseIcon /></IconButton>
                      </>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedReembolso ? 'Editar Caso' : 'Nuevo Caso de Reembolso'}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit} id="reembolso-form">
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {user?.rol_nombre === 'agente' && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Cliente</InputLabel>
                    <Select name="cliente_id" value={formData.cliente_id} onChange={handleInputChange} required>
                      {clientes.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.nombre} {c.apellido}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Contrato</InputLabel>
                  <Select name="contrato_id" value={formData.contrato_id} onChange={handleContratoChange} required>
                    {contratosFiltrados.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.id} - {c.nombre_seguro || c.seguro_nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth type="date" name="fecha_evento" label="Fecha del Evento" value={formData.fecha_evento} onChange={handleInputChange} InputLabelProps={{ shrink: true }} required />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de Gasto</InputLabel>
                  <Select name="tipo_gasto" value={formData.tipo_gasto} onChange={handleInputChange} required>
                    {getTipoGastoOptions().map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth type="number" name="monto" label="Monto a Reembolsar" value={formData.monto} onChange={handleInputChange} required />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={2} name="descripcion" label="Descripción" value={formData.descripcion} onChange={handleInputChange} required />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" component="label" fullWidth>
                  {file ? file.name : 'Subir Comprobante (PDF)'}
                  <input type="file" accept="application/pdf" hidden onChange={handleFileChange} />
                </Button>
                {comprobanteUrl && (
                  <Button href={comprobanteUrl} target="_blank" sx={{ mt: 1 }} startIcon={<VisibilityIcon />}>Ver Comprobante</Button>
                )}
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button type="submit" form="reembolso-form" variant="contained" color="primary" disabled={loading}>
            {loading ? 'Procesando...' : selectedReembolso ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
        <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ReimbursementManagement; 