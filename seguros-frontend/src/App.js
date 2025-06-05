import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import UserManagement from './components/UserManagement';
import ClientDashboard from './components/ClientDashboard';
import Layout from './components/Layout';
import Profile from './components/Profile';
import InsuranceManagement from './components/InsuranceManagement';
import PaymentManagement from './components/PaymentManagement';
import ContractManagement from './components/ContractManagement';
import { useAuth } from './context/AuthContext';
import AgentDashboard from './components/AgentDashboard';
import AssignedInsurances from './components/AssignedInsurances';
import CaseSearch from './components/CaseSearch';

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#1e3a5f',
      light: '#2c5282',
      dark: '#1a365d',
    },
    secondary: {
      main: '#2c5282',
    },
    background: {
      default: '#f0f2f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

function App() {
  const { isAuthenticated, user, loading } = useAuth();
  console.log('App Estado:', { 
    isAuthenticated, 
    user, 
    loading,
    userRole: user?.rol_nombre || user?.rol
  });

  const getUserRole = (user) => {
    const role = user?.rol_nombre || user?.rol;
    const normalizedRole = role?.toLowerCase();
    console.log('Obteniendo rol de usuario:', { 
      originalRole: role,
      normalizedRole,
      user
    });
    return normalizedRole;
  };

  const getRedirectPath = (userRole) => {
    console.log('Calculando ruta de redirección para rol:', userRole);
    switch (userRole) {
      case 'administrador':
        return '/admin';
      case 'cliente':
        return '/client';
      case 'asesor':
      case 'agente':
        return '/agent';
      default:
        console.log('Rol no reconocido, redirigiendo a login');
        return '/login';
    }
  };

  const PrivateRoute = ({ children, allowedRoles = [] }) => {
    console.log('PrivateRoute:', { 
      isAuthenticated, 
      userRole: user?.rol_nombre || user?.rol, 
      loading, 
      allowedRoles,
      user
    });
    
    if (loading) {
      console.log('PrivateRoute: Mostrando loader...');
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          bgcolor: '#f0f2f5'
        }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!isAuthenticated || !user) {
      console.log('PrivateRoute: Usuario no autenticado o sin datos, redirigiendo a login...');
      return <Navigate to="/login" replace />;
    }

    const userRole = getUserRole(user);
    if (!userRole) {
      console.log('PrivateRoute: Rol de usuario indefinido, redirigiendo a login...');
      return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      console.log('PrivateRoute: Usuario no tiene permisos, redirigiendo...');
      const redirectPath = getRedirectPath(userRole);
      return <Navigate to={redirectPath} replace />;
    }

    console.log('PrivateRoute: Renderizando contenido protegido...');
    return <Layout>{children}</Layout>;
  };

  if (loading) {
    console.log('App: Mostrando loader inicial...');
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          bgcolor: '#f0f2f5'
        }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  console.log('App: Renderizando rutas...');
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Ruta raíz - redirige a login si no está autenticado o al dashboard correspondiente si lo está */}
          <Route
            path="/"
            element={
              (() => {
                console.log('Ruta /: Verificando estado...', { 
                  isAuthenticated, 
                  user,
                  userRole: user?.rol_nombre || user?.rol 
                });

                if (!isAuthenticated || !user) {
                  console.log('Ruta /: Usuario no autenticado o sin datos');
                  return <Navigate to="/login" replace />;
                }

                const userRole = getUserRole(user);
                if (!userRole) {
                  console.log('Ruta /: Rol de usuario indefinido');
                  return <Navigate to="/login" replace />;
                }

                console.log('Ruta /: Usuario autenticado, rol:', userRole);
                const redirectPath = getRedirectPath(userRole);
                return <Navigate to={redirectPath} replace />;
              })()
            }
          />

          {/* Ruta de login */}
          <Route 
            path="/login" 
            element={
              (() => {
                if (isAuthenticated && user) {
                  const userRole = getUserRole(user);
                  if (userRole) {
                    console.log('Login: Usuario ya autenticado, redirigiendo a dashboard');
                    const redirectPath = getRedirectPath(userRole);
                    return <Navigate to={redirectPath} replace />;
                  }
                }
                console.log('Login: Mostrando página de login');
                return <Login />;
              })()
            }
          />

          {/* Rutas para administrador */}
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={['administrador']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute allowedRoles={['administrador']}>
                <UserManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/cases"
            element={
              <PrivateRoute allowedRoles={['administrador']}>
                <CaseSearch />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/insurances"
            element={
              <PrivateRoute allowedRoles={['administrador']}>
                <InsuranceManagement />
              </PrivateRoute>
            }
          />

          {/* Rutas para cliente */}
          <Route
            path="/client"
            element={
              <PrivateRoute allowedRoles={['cliente']}>
                <ClientDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/client/insurances"
            element={
              <PrivateRoute allowedRoles={['cliente']}>
                <InsuranceManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/client/payments"
            element={
              <PrivateRoute allowedRoles={['cliente']}>
                <PaymentManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/client/contracts"
            element={
              <PrivateRoute allowedRoles={['cliente']}>
                <ContractManagement />
              </PrivateRoute>
            }
          />

          {/* Rutas para asesor */}
          <Route
            path="/agent"
            element={
              <PrivateRoute allowedRoles={['asesor', 'agente']}>
                <AgentDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/agent/assigned"
            element={
              <PrivateRoute allowedRoles={['asesor', 'agente']}>
                <AssignedInsurances />
              </PrivateRoute>
            }
          />
          <Route
            path="/agent/cases"
            element={
              <PrivateRoute allowedRoles={['asesor', 'agente']}>
                <CaseSearch />
              </PrivateRoute>
            }
          />
          <Route
            path="/agent/insurances"
            element={
              <PrivateRoute allowedRoles={['asesor', 'agente']}>
                <InsuranceManagement />
              </PrivateRoute>
            }
          />

          {/* Ruta para cualquier otra URL no definida - redirige a la ruta raíz */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 