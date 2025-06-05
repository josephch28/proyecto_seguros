import React, { useState } from 'react';
import { Box, Typography, Grid, Paper, IconButton, useMediaQuery, useTheme, Drawer } from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

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

const DashboardContent = () => (
  <>
    <Typography variant="h4" component="h1" gutterBottom>
      Mi Panel de Cliente
    </Typography>
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Resumen de Mis Seguros
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            title="Seguros Activos"
            value="2"
            bgColor="rgba(213, 255, 213, 0.5)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            title="Pagos Pendientes"
            value="1"
            bgColor="rgba(255, 213, 213, 0.5)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            title="Reclamos en Proceso"
            value="0"
            bgColor="rgba(233, 213, 255, 0.5)"
          />
        </Grid>
      </Grid>
    </Box>
  </>
);

const ClienteDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar 
        onMenuClick={handleDrawerToggle}
        showMenuIcon={isMobile}
      />
      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Sidebar para pantallas grandes */}
        {!isMobile && (
          <Sidebar role="cliente" />
        )}

        {/* Sidebar móvil */}
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Mejor rendimiento en móviles
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: 280,
              backgroundColor: '#f0f2f5',
            },
          }}
        >
          <Sidebar role="cliente" />
        </Drawer>

        {/* Contenido principal */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 2, sm: 3 }, // Padding responsivo
            backgroundColor: '#fff',
            width: '100%',
            overflow: 'auto'
          }}
        >
          <Routes>
            <Route index element={<DashboardContent />} />
            <Route path="*" element={<DashboardContent />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
};

export default ClienteDashboard; 