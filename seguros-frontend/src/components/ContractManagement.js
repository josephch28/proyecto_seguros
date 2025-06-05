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
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Description as DocumentIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import axios from 'axios';

const ContractManagement = () => {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/client/contracts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContracts(response.data);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const handleOpenDetails = (contract) => {
    setSelectedContract(contract);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
  };

  const handleOpenViewer = (contract) => {
    setSelectedContract(contract);
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
  };

  const handleDownload = async (contract) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:3001/api/client/contracts/${contract.id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contrato-${contract.numero_contrato}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading contract:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'vigente':
        return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'por vencer':
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
        Contratos
      </Typography>

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Número de Contrato</TableCell>
              <TableCell>Tipo de Seguro</TableCell>
              <TableCell>Fecha de Inicio</TableCell>
              <TableCell>Fecha de Vencimiento</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell>{contract.numero_contrato}</TableCell>
                <TableCell>{contract.tipo_seguro}</TableCell>
                <TableCell>{new Date(contract.fecha_inicio).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(contract.fecha_vencimiento).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip
                    label={contract.estado}
                    sx={{
                      backgroundColor: getStatusColor(contract.estado).bg,
                      color: getStatusColor(contract.estado).color,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Ver Detalles">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDetails(contract)}
                    >
                      <DocumentIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Ver Documento">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenViewer(contract)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Descargar">
                    <IconButton
                      size="small"
                      onClick={() => handleDownload(contract)}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        {selectedContract && (
          <>
            <DialogTitle>
              Detalles del Contrato - {selectedContract.numero_contrato}
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Tipo de Seguro:</strong> {selectedContract.tipo_seguro}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Fecha de Inicio:</strong> {new Date(selectedContract.fecha_inicio).toLocaleDateString()}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Fecha de Vencimiento:</strong> {new Date(selectedContract.fecha_vencimiento).toLocaleDateString()}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Prima:</strong> ${selectedContract.prima}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Cobertura:</strong> {selectedContract.cobertura}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Beneficiarios:</strong> {selectedContract.beneficiarios}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Notas:</strong> {selectedContract.notas || 'Sin notas adicionales'}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetails}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog open={viewerOpen} onClose={handleCloseViewer} maxWidth="lg" fullWidth>
        {selectedContract && (
          <>
            <DialogTitle>
              Contrato - {selectedContract.numero_contrato}
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ width: '100%', height: '70vh' }}>
                <iframe
                  src={`http://localhost:3001/api/client/contracts/${selectedContract.id}/view`}
                  width="100%"
                  height="100%"
                  title="Contract Viewer"
                  style={{ border: 'none' }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseViewer}>Cerrar</Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload(selectedContract)}
              >
                Descargar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ContractManagement; 