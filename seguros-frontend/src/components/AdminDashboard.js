import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert } from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import UserManagement from './UserManagement';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    activeInsurances: 0
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

      const response = await axios.get('http://localhost:3001/api/admin/dashboard', {
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Bienvenido, {user?.nombre || 'Administrador'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Información General
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <InfoCard
              title="Total de Usuarios"
              value={dashboardData.totalUsers}
              bgColor="rgba(233, 213, 255, 0.5)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <InfoCard
              title="Usuarios Activos"
              value={dashboardData.activeUsers}
              bgColor="rgba(213, 255, 213, 0.5)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <InfoCard
              title="Seguros Activos"
              value={dashboardData.activeInsurances}
              bgColor="rgba(255, 213, 213, 0.5)"
            />
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

const AdminDashboard = () => {
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
      <Routes>
        <Route index element={<DashboardContent />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="*" element={<DashboardContent />} />
      </Routes>
    </Box>
  );
};

export default AdminDashboard; 