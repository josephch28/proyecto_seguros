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
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { AttachMoney as MoneyIcon } from '@mui/icons-material';
import axios from 'axios';

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    totalPaid: 0,
    pendingPayments: 0,
    nextPaymentDate: null,
  });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchSummary();
  }, []);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/client/payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/client/payments/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleOpenDetails = (payment) => {
    setSelectedPayment(payment);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
  };

  const handlePay = async (payment) => {
    setLoadingPay(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:3001/api/pagos/${payment.id}/registrar`, {
        monto: payment.monto,
        fecha_pago: new Date().toISOString().split('T')[0],
        comprobante: 'Pago realizado por el cliente'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPayments();
      fetchSummary();
      setDetailsOpen(false);
    } catch (error) {
      alert('Error al realizar el pago');
    } finally {
      setLoadingPay(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pagado':
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
        Gestión de Pagos
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', backgroundColor: '#e8f5e9' }}>
            <CardContent>
              <MoneyIcon sx={{ fontSize: 40, color: '#2e7d32', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Total Pagado
              </Typography>
              <Typography variant="h4">
                ${summary.totalPaid}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', backgroundColor: '#fff8e1' }}>
            <CardContent>
              <MoneyIcon sx={{ fontSize: 40, color: '#f57f17', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Pagos Pendientes
              </Typography>
              <Typography variant="h4">
                {summary.pendingPayments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', backgroundColor: '#f3e5f5' }}>
            <CardContent>
              <MoneyIcon sx={{ fontSize: 40, color: '#6a1b9a', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Próximo Pago
              </Typography>
              <Typography variant="h4">
                {summary.nextPaymentDate ? new Date(summary.nextPaymentDate).toLocaleDateString() : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Fecha</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Seguro</TableCell>
              <TableCell>Método de Pago</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{new Date(payment.fecha).toLocaleDateString()}</TableCell>
                <TableCell>${payment.monto}</TableCell>
                <TableCell>{payment.seguro}</TableCell>
                <TableCell>{payment.metodo_pago}</TableCell>
                <TableCell>
                  <Chip
                    label={payment.estado}
                    sx={{
                      backgroundColor: getStatusColor(payment.estado).bg,
                      color: getStatusColor(payment.estado).color,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleOpenDetails(payment)}
                  >
                    Ver Detalles
                  </Button>
                  {payment.estado === 'pendiente' && (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      sx={{ ml: 1 }}
                      onClick={() => handlePay(payment)}
                      disabled={loadingPay}
                    >
                      {loadingPay ? 'Procesando...' : 'Realizar Pago'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        {selectedPayment && (
          <>
            <DialogTitle>
              Detalles del Pago
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>ID de Transacción:</strong> {selectedPayment.id_transaccion}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Fecha:</strong> {new Date(selectedPayment.fecha).toLocaleDateString()}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Monto:</strong> ${selectedPayment.monto}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Seguro:</strong> {selectedPayment.seguro}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Método de Pago:</strong> {selectedPayment.metodo_pago}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Estado:</strong> {selectedPayment.estado}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Notas:</strong> {selectedPayment.notas || 'Sin notas adicionales'}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetails}>Cerrar</Button>
              {selectedPayment && selectedPayment.estado === 'pendiente' && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handlePay(selectedPayment)}
                  disabled={loadingPay}
                >
                  {loadingPay ? 'Procesando...' : 'Realizar Pago'}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default PaymentManagement; 