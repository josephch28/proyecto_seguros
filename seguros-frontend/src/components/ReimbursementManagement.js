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
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

const ReimbursementManagement = () => {
  const [reimbursements, setReimbursements] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    contrato_id: '',
    monto: '',
    fecha_solicitud: '',
    fecha_aprobacion: '',
    estado: 'pendiente',
    motivo: '',
    documentos: '',
    notas: ''
  });

  useEffect(() => {
    fetchReimbursements();
    fetchContracts();
  }, []);

  const fetchReimbursements = async () => {
    try {
      const response = await axios.get('/api/reimbursements');
      setReimbursements(response.data);
    } catch (error) {
      setError('Error al cargar los reembolsos');
    }
  };

  const fetchContracts = async () => {
    try {
      const response = await axios.get('/api/contracts');
      setContracts(response.data);
    } catch (error) {
      setError('Error al cargar los contratos');
    }
  };

  const handleOpenDialog = (reimbursement = null) => {
    if (reimbursement) {
      setSelectedReimbursement(reimbursement);
      setFormData({
        contrato_id: reimbursement.contrato_id,
        monto: reimbursement.monto,
        fecha_solicitud: reimbursement.fecha_solicitud,
        fecha_aprobacion: reimbursement.fecha_aprobacion || '',
        estado: reimbursement.estado,
        motivo: reimbursement.motivo,
        documentos: reimbursement.documentos,
        notas: reimbursement.notas
      });
    } else {
      setSelectedReimbursement(null);
      setFormData({
        contrato_id: '',
        monto: '',
        fecha_solicitud: new Date().toISOString().split('T')[0],
        fecha_aprobacion: '',
        estado: 'pendiente',
        motivo: '',
        documentos: '',
        notas: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedReimbursement(null);
    setFormData({
      contrato_id: '',
      monto: '',
      fecha_solicitud: '',
      fecha_aprobacion: '',
      estado: 'pendiente',
      motivo: '',
      documentos: '',
      notas: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (selectedReimbursement) {
        await axios.put(`/api/reimbursements/${selectedReimbursement.id}`, formData);
        setSuccess('Reembolso actualizado exitosamente');
      } else {
        await axios.post('/api/reimbursements', formData);
        setSuccess('Reembolso creado exitosamente');
      }
      handleCloseDialog();
      fetchReimbursements();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al procesar el reembolso');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este reembolso?')) {
      try {
        await axios.delete(`/api/reimbursements/${id}`);
        setSuccess('Reembolso eliminado exitosamente');
        fetchReimbursements();
      } catch (error) {
        setError('Error al eliminar el reembolso');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'aprobado':
        return 'success';
      case 'pendiente':
        return 'warning';
      case 'rechazado':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Gestión de Reembolsos</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenDialog()}
        >
          Nuevo Reembolso
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Contrato</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Fecha Solicitud</TableCell>
              <TableCell>Fecha Aprobación</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Motivo</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reimbursements.map((reimbursement) => (
              <TableRow key={reimbursement.id}>
                <TableCell>{reimbursement.contrato_numero}</TableCell>
                <TableCell>${reimbursement.monto}</TableCell>
                <TableCell>{new Date(reimbursement.fecha_solicitud).toLocaleDateString()}</TableCell>
                <TableCell>
                  {reimbursement.fecha_aprobacion
                    ? new Date(reimbursement.fecha_aprobacion).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={reimbursement.estado}
                    color={getStatusColor(reimbursement.estado)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{reimbursement.motivo}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(reimbursement)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(reimbursement.id)}>
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
          {selectedReimbursement ? 'Editar Reembolso' : 'Nuevo Reembolso'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Contrato</InputLabel>
                <Select
                  name="contrato_id"
                  value={formData.contrato_id}
                  onChange={handleInputChange}
                  required
                >
                  {contracts.map((contract) => (
                    <MenuItem key={contract.id} value={contract.id}>
                      {contract.numero_contrato} - {contract.cliente_nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                name="monto"
                label="Monto"
                value={formData.monto}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                name="fecha_solicitud"
                label="Fecha de Solicitud"
                value={formData.fecha_solicitud}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                name="fecha_aprobacion"
                label="Fecha de Aprobación"
                value={formData.fecha_aprobacion}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="aprobado">Aprobado</MenuItem>
                  <MenuItem value="rechazado">Rechazado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                name="motivo"
                label="Motivo"
                value={formData.motivo}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                name="documentos"
                label="Documentos Adjuntos"
                value={formData.documentos}
                onChange={handleInputChange}
                helperText="Lista de documentos adjuntos separados por comas"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                name="notas"
                label="Notas Adicionales"
                value={formData.notas}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? 'Procesando...' : selectedReimbursement ? 'Actualizar' : 'Crear'}
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

export default ReimbursementManagement; 