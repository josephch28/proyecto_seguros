import React, { useState } from 'react';
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
  TextField,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const AssignedInsurances = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [seguros] = useState([
    {
      id: 1,
      cliente: 'Juan Pérez',
      tipo: 'Seguro de vida',
      estado: 'Activo',
      fechaInicio: '01/04/2025',
      fechaFin: '01/08/2025',
      monto: '$ 150.000,00'
    },
    {
      id: 2,
      cliente: 'María López',
      tipo: 'Seguro de auto',
      estado: 'Activo',
      fechaInicio: '15/03/2025',
      fechaFin: '15/03/2026',
      monto: '$ 25.000,00'
    },
    {
      id: 3,
      cliente: 'Carlos Gómez',
      tipo: 'Seguro de hogar',
      estado: 'Vencido',
      fechaInicio: '01/01/2024',
      fechaFin: '01/01/2025',
      monto: '$ 75.000,00'
    },
    {
      id: 4,
      cliente: 'Ana Sánchez',
      tipo: 'Seguro de vida',
      estado: 'Activo',
      fechaInicio: '01/06/2025',
      fechaFin: '01/06/2026',
      monto: '$ 200.000,00'
    }
  ]);

  const filteredSeguros = seguros.filter(seguro =>
    seguro.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seguro.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seguro.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box 
      component="main" 
      sx={{ 
        flexGrow: 1,
        p: 3,
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 2,
        boxShadow: '0 0 10px rgba(0,0,0,0.1)'
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Seguros Asignados
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por cliente, tipo de seguro o estado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 600 }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Tipo de Seguro</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha Inicio</TableCell>
              <TableCell>Fecha Fin</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSeguros.map((seguro) => (
              <TableRow key={seguro.id}>
                <TableCell>{seguro.cliente}</TableCell>
                <TableCell>{seguro.tipo}</TableCell>
                <TableCell>
                  <Chip 
                    label={seguro.estado}
                    color={seguro.estado === 'Activo' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{seguro.fechaInicio}</TableCell>
                <TableCell>{seguro.fechaFin}</TableCell>
                <TableCell>{seguro.monto}</TableCell>
                <TableCell>
                  <Button
                    variant="text"
                    size="small"
                    sx={{ color: '#1e3a5f' }}
                  >
                    Ver detalles
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AssignedInsurances; 