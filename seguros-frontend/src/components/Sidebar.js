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

const Sidebar = ({ open, onClose, variant = "permanent", role }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const getMenuItems = () => {
    switch (role) {
      case 'asesor':
      case 'agente':
        return [
          { text: 'Dashboard', path: '/agent', icon: <DashboardIcon /> },
          { text: 'Seguros Asignados', path: '/agent/assigned', icon: <AssignmentIcon /> },
          { text: 'Buscar Casos', path: '/agent/cases', icon: <SearchIcon /> },
          { text: 'Seguros', path: '/agent/insurances', icon: <SecurityIcon /> }
        ];
      case 'administrador':
        return [
          { text: 'Dashboard', path: '/admin', icon: <DashboardIcon /> },
          { text: 'Usuarios', path: '/admin/users', icon: <PeopleIcon /> }
        ];
      case 'cliente':
        return [
          { text: 'Dashboard', path: '/client', icon: <DashboardIcon /> },
          { text: 'Mis Seguros', path: '/client/insurances', icon: <SecurityIcon /> },
          { text: 'Pagos', path: '/client/payments', icon: <PaymentIcon /> },
          { text: 'Contratos', path: '/client/contracts', icon: <DescriptionIcon /> }
        ];
      default:
        return [];
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (variant === "temporary") {
      onClose();
    }
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
        {getMenuItems().map((item) => (
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
        ))}
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