import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import axios from 'axios';

const InsuranceManagement = () => {
  const [insurances, setInsurances] = useState([]);
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchInsurances();
  }, []);

  const fetchInsurances = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/client/insurances', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInsurances(response.data);
    } catch (error) {
      console.error('Error fetching insurances:', error);
    }
  };

  const handleOpenDetails = (insurance) => {
    setSelectedInsurance(insurance);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'activo':
        return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'pendiente':
        return { bg: '#fff8e1', color: '#f57f17' };
      case 'vencido':
        return { bg: '#ffebee', color: '#c62828' };
      default:
        return { bg: '#f5f5f5', color: '#757575' };
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Mis Seguros
      </Typography>

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Tipo de Seguro</TableCell>
              <TableCell>Número de Póliza</TableCell>
              <TableCell>Fecha de Inicio</TableCell>
              <TableCell>Fecha de Vencimiento</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {insurances.map((insurance) => (
              <TableRow key={insurance.id}>
                <TableCell>{insurance.tipo}</TableCell>
                <TableCell>{insurance.numero_poliza}</TableCell>
                <TableCell>{new Date(insurance.fecha_inicio).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(insurance.fecha_vencimiento).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip
                    label={insurance.estado}
                    sx={{
                      backgroundColor: getStatusColor(insurance.estado).bg,
                      color: getStatusColor(insurance.estado).color,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleOpenDetails(insurance)}
                  >
                    Ver Detalles
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        {selectedInsurance && (
          <>
            <DialogTitle>
              Detalles del Seguro - {selectedInsurance.tipo}
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Número de Póliza:</strong> {selectedInsurance.numero_poliza}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Cobertura:</strong> {selectedInsurance.cobertura}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Prima Mensual:</strong> ${selectedInsurance.prima_mensual}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Beneficiarios:</strong> {selectedInsurance.beneficiarios}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Notas:</strong> {selectedInsurance.notas || 'Sin notas adicionales'}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetails}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default InsuranceManagement; 