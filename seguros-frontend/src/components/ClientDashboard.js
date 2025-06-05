import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CaseIcon from '@mui/icons-material/Folder';
import InsuranceIcon from '@mui/icons-material/Security';
import DocumentIcon from '@mui/icons-material/Description';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const StyledCard = styled(Card)(({ theme, color }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
  backgroundColor: color,
  color: '#000000',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8],
  },
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3),
  }
}));

const ClientDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    activeCases: 0,
    activeInsurances: 0,
    documents: 0,
    cases: []
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

      const response = await axios.get('http://localhost:3001/api/client/dashboard', {
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

  const summaryCards = [
    {
      title: 'Casos Activos',
      value: dashboardData.activeCases || 0,
      color: '#ffebee',
      icon: <CaseIcon sx={{ fontSize: isMobile ? 32 : 40, color: '#c62828' }} />
    },
    {
      title: 'Seguros activos',
      value: dashboardData.activeInsurances || 0,
      color: '#fff8e1',
      icon: <InsuranceIcon sx={{ fontSize: isMobile ? 32 : 40, color: '#f9a825' }} />
    },
    {
      title: 'Documentos',
      value: dashboardData.documents || 0,
      color: '#e8f5e9',
      icon: <DocumentIcon sx={{ fontSize: isMobile ? 32 : 40, color: '#2e7d32' }} />
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={isMobile ? 2 : 3} sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        component="h1" 
        sx={{ 
          fontWeight: 'bold',
          textAlign: isMobile ? 'center' : 'left',
          mb: isMobile ? 1 : 2
        }}
      >
        Bienvenido, {user?.nombre || 'Cliente'}
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

      <Grid container spacing={isMobile ? 2 : 3}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={4} key={index}>
            <StyledCard color={card.color}>
              <CardContent sx={{ textAlign: 'center', width: '100%', p: isMobile ? 1 : 2 }}>
                {card.icon}
                <Typography 
                  variant={isMobile ? "h4" : "h3"} 
                  component="div" 
                  sx={{ 
                    my: isMobile ? 0.5 : 1,
                    fontSize: isMobile ? '2rem' : '3rem'
                  }}
                >
                  {card.value}
                </Typography>
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"} 
                  color="text.secondary"
                  sx={{
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    fontWeight: 500
                  }}
                >
                  {card.title}
                </Typography>
              </CardContent>
            </StyledCard>
          </Grid>
        ))}
      </Grid>

      <Typography 
        variant={isMobile ? "h6" : "h5"} 
        component="h2" 
        sx={{ 
          fontWeight: 'bold',
          mt: isMobile ? 2 : 4,
          mb: isMobile ? 1 : 3,
          textAlign: isMobile ? 'center' : 'left'
        }}
      >
        Mis casos
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
                <TableCell>Casos</TableCell>
                <TableCell>Código de Caso</TableCell>
                <TableCell>Asesor</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Fecha Límite</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dashboardData.cases && dashboardData.cases.length > 0 ? (
                dashboardData.cases.map((caso, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{caso.titulo}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{caso.codigo}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{caso.asesor}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          backgroundColor: 
                            caso.estado === 'Activo' ? '#e8f5e9' :
                            caso.estado === 'Pendiente' ? '#fff8e1' : '#ffebee',
                          color: 
                            caso.estado === 'Activo' ? '#2e7d32' :
                            caso.estado === 'Pendiente' ? '#f57f17' : '#c62828',
                          py: 0.5,
                          px: isMobile ? 1 : 2,
                          borderRadius: 1,
                          display: 'inline-block',
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          fontWeight: 500,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {caso.estado}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {new Date(caso.fecha_limite).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell 
                    colSpan={5} 
                    align="center" 
                    sx={{ 
                      py: 3,
                      color: 'text.secondary'
                    }}
                  >
                    No hay casos activos
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

export default ClientDashboard; 