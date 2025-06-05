import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

const CaseSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [casos] = useState([
    {
      id: 1,
      cliente: 'Juan Pérez',
      tipo: 'Seguro de vida',
      estado: 'Pendiente',
      fechaSolicitud: '01/04/2025',
      descripcion: 'Solicitud de nuevo seguro de vida con cobertura extendida'
    },
    {
      id: 2,
      cliente: 'María López',
      tipo: 'Seguro de auto',
      estado: 'En revisión',
      fechaSolicitud: '15/03/2025',
      descripcion: 'Actualización de cobertura para vehículo existente'
    },
    {
      id: 3,
      cliente: 'Carlos Gómez',
      tipo: 'Seguro de hogar',
      estado: 'Completado',
      fechaSolicitud: '01/01/2024',
      descripcion: 'Reclamo por daños causados por inundación'
    },
    {
      id: 4,
      cliente: 'Ana Sánchez',
      tipo: 'Seguro de vida',
      estado: 'Pendiente',
      fechaSolicitud: '01/06/2025',
      descripcion: 'Modificación de beneficiarios del seguro'
    }
  ]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pendiente':
        return 'warning';
      case 'en revisión':
        return 'info';
      case 'completado':
        return 'success';
      default:
        return 'default';
    }
  };

  const filteredCasos = casos.filter(caso => {
    const matchesSearch = 
      caso.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caso.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caso.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'todos' || 
      caso.estado.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

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
        Buscar Casos
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar por cliente, tipo de seguro o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="status-filter-label">
                <FilterListIcon sx={{ mr: 1 }} />
                Filtrar por estado
              </InputLabel>
              <Select
                labelId="status-filter-label"
                value={filterStatus}
                label="Filtrar por estado"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="en revisión">En revisión</MenuItem>
                <MenuItem value="completado">Completado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {filteredCasos.map((caso) => (
          <Grid item xs={12} md={6} key={caso.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    {caso.cliente}
                  </Typography>
                  <Chip 
                    label={caso.estado}
                    color={getStatusColor(caso.estado)}
                    size="small"
                  />
                </Box>
                <Typography color="text.secondary" gutterBottom>
                  {caso.tipo}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  {caso.descripcion}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Fecha de solicitud: {caso.fechaSolicitud}
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  sx={{ color: '#1e3a5f' }}
                >
                  Ver detalles
                </Button>
                <Button 
                  size="small" 
                  sx={{ color: '#1e3a5f' }}
                >
                  Actualizar estado
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CaseSearch; 