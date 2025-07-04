import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  useTheme,
  Divider,
  ListItemButton
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SearchIcon from '@mui/icons-material/Search';
import SecurityIcon from '@mui/icons-material/Security';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import DescriptionIcon from '@mui/icons-material/Description';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Link } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';
import { Receipt as ReceiptIcon } from '@mui/icons-material';

const drawerWidth = 300;

const getIcon = (iconName) => {
  switch (iconName) {
    case 'dashboard':
      return <DashboardIcon />;
    case 'assignment':
      return <AssignmentIcon />;
    case 'search':
      return <SearchIcon />;
    case 'security':
      return <SecurityIcon />;
    case 'people':
      return <PeopleIcon />;
    case 'payment':
      return <PaymentIcon />;
    case 'description':
      return <DescriptionIcon />;
    default:
      return <DashboardIcon />;
  }
};

const Sidebar = ({ open, onClose, variant = "permanent" }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth(); // Get user and logout from auth context
  const userRole = user?.rol_nombre || user?.rol;

  // Use a mapping to get the correct path for each role's dashboard
  const getDashboardPath = (role) => {
    switch(role) {
      case 'administrador': return '/admin';
      case 'cliente': return '/client';
      case 'agente':
      case 'asesor': return '/agent';
      default: return '/'; // Should not happen if roles are handled correctly
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (variant === "temporary") {
      onClose();
    }
  };

  const handleLogout = () => {
    logout();
    // Optionally redirect to login page after logout
    navigate('/login');
  };

  const menuItems = {
    administrador: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
      { text: 'Gestión de Usuarios', icon: <PeopleIcon />, path: '/admin/users' },
      { text: 'Gestión de Seguros', icon: <SecurityIcon />, path: '/admin/insurances' },
    ],
    agente: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/agent' },
      { text: 'Seguros Asignados', icon: <AssignmentIcon />, path: '/agent/assigned' },
      { text: 'Búsqueda de Casos', icon: <SearchIcon />, path: '/agent/cases' },
      { text: 'Gestión de Seguros', icon: <SecurityIcon />, path: '/agent/insurances' },
      { text: 'Gestión de Clientes', icon: <PeopleIcon />, path: '/agent/clients' },
    ],
    cliente: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/client' },
      { text: 'Mis Contratos', icon: <DescriptionIcon />, path: '/client/contracts' },
      { text: 'Mis Pagos', icon: <PaymentIcon />, path: '/client/payments' },
      { text: 'Mis Reembolsos', icon: <ReceiptIcon />, path: '/client/reimbursements' },
    ],
  };

  const drawer = (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          p: 1
        }}
      >
        {variant === "temporary" && (
          <IconButton onClick={onClose}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>
      <Divider />
      <List>
        {menuItems[userRole].map((item) => {
          // Determine the effective role for filtering
          const effectiveRole = userRole;

          // If the item has roles defined, check if the user's effective role is included
          if (item.roles && !item.roles.includes(effectiveRole)) {
            return null; // Hide the item if the user's role is not in the allowed roles
          }

           // If no roles are defined for the item, assume it's visible to all roles currently handled.
           if (!item.roles && effectiveRole && !['cliente', 'agente', 'admin', 'asesor'].includes(effectiveRole)) {
               // This case handles potential future roles that shouldn't see items without role restrictions
               return null; // Hide if it has no specific roles and the user's role is not a recognized one
          }


          return (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(30, 58, 95, 0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(30, 58, 95, 0.12)',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(30, 58, 95, 0.04)',
                },
              }}
            >
              <ListItemIcon sx={{ color: '#1e3a5f' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    color: '#1e3a5f',
                    fontWeight: location.pathname === item.path ? 600 : 400,
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
          );
        })}
      </List>
    </>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.default,
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      {drawer}
    </Drawer>
  );
};

export default Sidebar; 