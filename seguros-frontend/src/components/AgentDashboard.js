import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Drawer,
  useTheme,
  useMediaQuery,
  CssBaseline,
  Toolbar,
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import AssignedInsurances from './AssignedInsurances';
import CaseSearch from './CaseSearch';
import InsuranceManagement from './InsuranceManagement';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const drawerWidth = 300;

const InfoCard = ({ title, value, bgColor }) => (
  <Paper
    sx={{
      p: 3,
      borderRadius: 2,
      bgcolor: bgColor,
      height: '100%',
      minHeight: 120,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#000',
    }}
  >
    <Typography variant="h6" component="div" align="center" gutterBottom>
      {title}
    </Typography>
    <Typography variant="h4" component="div" align="center">
      {value}
    </Typography>
  </Paper>
);

const DashboardContent = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalClients: 0,
    activeInsurances: 0,
    pendingInsurances: 0,
    assignedInsurances: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      const response = await axios.get('http://localhost:3006/api/agent/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.message || 'Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={isMobile ? 2 : 3} sx={{ width: '100%' }}>
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        component="h1" 
        sx={{ 
          fontWeight: 'bold',
          textAlign: isMobile ? 'center' : 'left',
          mb: isMobile ? 1 : 2
        }}
      >
        Bienvenido, {user?.nombre || 'Agente'}
      </Typography>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            width: '100%',
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: isMobile ? 'center' : 'flex-start' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          fullWidth={isMobile}
          sx={{
            backgroundColor: '#1e3a5f',
            '&:hover': {
              backgroundColor: '#2c5282',
            },
          }}
        >
          Añadir caso
        </Button>
      </Box>

      <Grid container spacing={isMobile ? 2 : 3}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              p: isMobile ? 2 : 3,
              borderRadius: 2,
              bgcolor: 'rgba(233, 213, 255, 0.5)',
              height: '100%',
              minHeight: isMobile ? 100 : 120,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#000',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 3,
              },
            }}
          >
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"} 
              component="div" 
              align="center" 
              gutterBottom
            >
              Total de clientes
            </Typography>
            <Typography 
              variant={isMobile ? "h4" : "h3"} 
              component="div" 
              align="center"
            >
              {dashboardData.totalClients}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              p: isMobile ? 2 : 3,
              borderRadius: 2,
              bgcolor: 'rgba(213, 255, 213, 0.5)',
              height: '100%',
              minHeight: isMobile ? 100 : 120,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#000',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 3,
              },
            }}
          >
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"} 
              component="div" 
              align="center" 
              gutterBottom
            >
              Seguros activos
            </Typography>
            <Typography 
              variant={isMobile ? "h4" : "h3"} 
              component="div" 
              align="center"
            >
              {dashboardData.activeInsurances}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              p: isMobile ? 2 : 3,
              borderRadius: 2,
              bgcolor: 'rgba(255, 213, 213, 0.5)',
              height: '100%',
              minHeight: isMobile ? 100 : 120,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#000',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 3,
              },
            }}
          >
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"} 
              component="div" 
              align="center" 
              gutterBottom
            >
              Seguros Pendientes
            </Typography>
            <Typography 
              variant={isMobile ? "h4" : "h3"} 
              component="div" 
              align="center"
            >
              {dashboardData.pendingInsurances}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Typography 
        variant={isMobile ? "h6" : "h5"} 
        sx={{ 
          fontWeight: 'bold',
          mt: isMobile ? 2 : 3,
          mb: isMobile ? 1 : 2,
          textAlign: isMobile ? 'center' : 'left'
        }}
      >
        Seguros Asignados
      </Typography>

      <Box sx={{ overflowX: 'auto', width: '100%' }}>
        <TableContainer 
          component={Paper} 
          sx={{ 
            borderRadius: 2, 
            boxShadow: 1,
            '& .MuiTable-root': {
              minWidth: isMobile ? 600 : 'auto'
            }
          }}
        >
          <Table size={isMobile ? "small" : "medium"}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Cliente</TableCell>
                <TableCell>Seguro</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dashboardData.assignedInsurances && dashboardData.assignedInsurances.length > 0 ? (
                dashboardData.assignedInsurances.map((seguro, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{seguro.cliente}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{seguro.seguro}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          backgroundColor: 
                            seguro.estado === 'Activo' ? '#e8f5e9' :
                            seguro.estado === 'Pendiente' ? '#fff8e1' : '#ffebee',
                          color: 
                            seguro.estado === 'Activo' ? '#2e7d32' :
                            seguro.estado === 'Pendiente' ? '#f57f17' : '#c62828',
                          py: 0.5,
                          px: isMobile ? 1 : 2,
                          borderRadius: 1,
                          display: 'inline-block',
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          fontWeight: 500,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {seguro.estado}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="text"
                        size={isMobile ? "small" : "medium"}
                        sx={{ 
                          color: '#1e3a5f',
                          '&:hover': {
                            backgroundColor: 'rgba(30, 58, 95, 0.04)'
                          },
                          minWidth: isMobile ? 'auto' : '64px'
                        }}
                      >
                        Ver más
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell 
                    colSpan={4} 
                    align="center" 
                    sx={{ 
                      py: 3,
                      color: 'text.secondary'
                    }}
                  >
                    No hay seguros asignados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Stack>
  );
};

const AgentDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box 
      component="main" 
      sx={{ 
        flexGrow: 1,
        p: isMobile ? 2 : 3,
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 2,
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}
    >
      <Routes>
        <Route index element={<DashboardContent />} />
        <Route path="assigned" element={<AssignedInsurances />} />
        <Route path="cases" element={<CaseSearch />} />
        <Route path="insurances" element={<InsuranceManagement />} />
        <Route path="*" element={<DashboardContent />} />
      </Routes>
    </Box>
  );
};

export default AgentDashboard; 