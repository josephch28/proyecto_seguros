import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  People as PeopleIcon,
  Security as SecurityIcon,
  Payment as PaymentIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInsurances: 0,
    totalContracts: 0,
    totalReimbursements: 0,
    recentContracts: [],
    pendingReimbursements: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/dashboard');
      setStats(response.data);
    } catch (error) {
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const renderAdminDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PeopleIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Usuarios Totales</Typography>
            </Box>
            <Typography variant="h4">{stats.totalUsers}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SecurityIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Seguros Activos</Typography>
            </Box>
            <Typography variant="h4">{stats.totalInsurances}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DescriptionIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Contratos Activos</Typography>
            </Box>
            <Typography variant="h4">{stats.totalContracts}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PaymentIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Reembolsos Pendientes</Typography>
            </Box>
            <Typography variant="h4">{stats.totalReimbursements}</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderAgentDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Contratos Recientes" />
          <CardContent>
            <List>
              {stats.recentContracts.map((contract) => (
                <React.Fragment key={contract.id}>
                  <ListItem>
                    <ListItemText
                      primary={contract.cliente_nombre}
                      secondary={`${contract.seguro_nombre} - ${new Date(contract.fecha_inicio).toLocaleDateString()}`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Reembolsos Pendientes" />
          <CardContent>
            <List>
              {stats.pendingReimbursements.map((reimbursement) => (
                <React.Fragment key={reimbursement.id}>
                  <ListItem>
                    <ListItemText
                      primary={`${reimbursement.cliente_nombre} - $${reimbursement.monto}`}
                      secondary={`${reimbursement.motivo} - ${new Date(reimbursement.fecha_solicitud).toLocaleDateString()}`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderClientDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Mis Seguros Activos" />
          <CardContent>
            <List>
              {stats.recentContracts.map((contract) => (
                <React.Fragment key={contract.id}>
                  <ListItem>
                    <ListItemText
                      primary={contract.seguro_nombre}
                      secondary={`Vence: ${new Date(contract.fecha_fin).toLocaleDateString()}`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Mis Reembolsos" />
          <CardContent>
            <List>
              {stats.pendingReimbursements.map((reimbursement) => (
                <React.Fragment key={reimbursement.id}>
                  <ListItem>
                    <ListItemText
                      primary={`$${reimbursement.monto} - ${reimbursement.estado}`}
                      secondary={`${reimbursement.motivo} - ${new Date(reimbursement.fecha_solicitud).toLocaleDateString()}`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      {user?.rol_nombre?.toLowerCase() === 'administrador' && renderAdminDashboard()}
      {(user?.rol_nombre?.toLowerCase() === 'agente' || user?.rol_nombre?.toLowerCase() === 'asesor') && renderAgentDashboard()}
      {user?.rol_nombre?.toLowerCase() === 'cliente' && renderClientDashboard()}
    </Box>
  );
};

export default Dashboard; 