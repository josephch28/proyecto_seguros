import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  CssBaseline,
  CircularProgress,
  Divider,
  Button
} from '@mui/material';
import {
  Menu as MenuIcon,
  Security as SecurityIcon,
  Payment as PaymentIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Search as SearchIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  LocalHospital as HealthIcon,
  Favorite as LifeIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Profile from './Profile';

const drawerWidth = 300;

const Layout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openProfile, setOpenProfile] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [avatarKey, setAvatarKey] = useState(0);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    console.log('Layout - User data:', user);
    console.log('Layout - Profile image URL:', user?.foto_perfil);
    if (user?.foto_perfil) {
      // Agregar timestamp para evitar caché
      const imageUrl = `${user.foto_perfil}${user.foto_perfil.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;
      
      // Verificar si la imagen existe
      fetch(imageUrl)
        .then(response => {
          if (!response.ok) {
            console.error('Layout - Error loading image:', response.status);
            setAvatarError(true);
          } else {
            setAvatarError(false);
            // Forzar actualización del avatar
            setAvatarKey(prev => prev + 1);
          }
        })
        .catch(error => {
          console.error('Layout - Error fetching image:', error);
          setAvatarError(true);
        });
    } else {
      setAvatarError(true);
    }
  }, [user?.foto_perfil]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      setUserRole(decodedToken.rol);
    }
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleProfileClick = () => {
    handleProfileMenuClose();
    setOpenProfile(true);
  };

  const handleAvatarError = () => {
    console.error('Layout - Error loading avatar image:', user?.foto_perfil);
    setAvatarError(true);
  };

  const getMenuItems = () => {
    const items = [];

    // Items comunes para todos los roles
    items.push({
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: getDashboardPath(userRole)
    });

    // Items específicos por rol
    switch (userRole) {
      case 'administrador':
        items.push(
          {
            text: 'Gestión de Usuarios',
            icon: <PeopleIcon />,
            path: '/admin/users'
          },
          {
            text: 'Gestión de Seguros',
            icon: <SecurityIcon />,
            path: '/admin/insurances'
          }
        );
        break;
      case 'agente':
      case 'asesor':
        items.push(
          {
            text: 'Gestión de Clientes',
            icon: <PeopleIcon />,
            path: '/agent/clients'
          },
          {
            text: 'Contratación de Seguros',
            icon: <DescriptionIcon />,
            path: '/agent/contracts'
          },
          {
            text: 'Reembolsos',
            icon: <PaymentIcon />,
            path: '/agent/reimbursements'
          },
          {
            text: 'Reportes',
            icon: <AssignmentIcon />,
            path: '/agent/reports'
          }
        );
        break;
      case 'cliente':
        items.push(
          {
            text: 'Mis Seguros',
            icon: <SecurityIcon />,
            path: '/client/insurances'
          },
          {
            text: 'Mis Contratos',
            icon: <DescriptionIcon />,
            path: '/client/contracts'
          },
          {
            text: 'Mis Pagos',
            icon: <PaymentIcon />,
            path: '/client/payments'
          },
          {
            text: 'Reembolsos',
            icon: <DescriptionIcon />,
            path: '/client/reimbursements'
          }
        );
        break;
    }

    return items;
  };

  const getDashboardPath = (userRole) => {
    switch (userRole) {
      case 'administrador':
        return '/admin';
      case 'agente':
      case 'asesor':
        return '/agent';
      case 'cliente':
        return '/client';
      default:
        return '/';
    }
  };

  const drawer = (
    <>
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List sx={{ px: 2 }}>
          {getMenuItems().map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                mb: 1,
                borderRadius: 1,
                whiteSpace: 'nowrap',
                '&.Mui-selected': {
                  backgroundColor: '#1e3a5f',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#2c5282',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(30, 58, 95, 0.08)',
                },
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 40,
                color: location.pathname === item.path ? 'white' : 'inherit'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  style: {
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </>
  );

  const renderAvatar = () => {
    if (loading) {
      return <CircularProgress size={24} />;
    }

    if (user?.foto_perfil && !avatarError) {
      return (
        <Avatar
          key={avatarKey}
          src={user.foto_perfil}
          alt={user.nombre || 'Usuario'}
          onError={handleAvatarError}
          sx={{ width: 40, height: 40, cursor: 'pointer' }}
        />
      );
    }

    return (
      <Avatar sx={{ width: 40, height: 40, cursor: 'pointer', bgcolor: theme.palette.primary.main }}>
        {user?.nombre ? user.nombre.charAt(0).toUpperCase() : <PersonIcon />}
      </Avatar>
    );
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: '#1e3a5f',
          zIndex: theme.zIndex.drawer + 1,
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          width: '100%'
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            GOSafe Seguros S.A.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography 
              variant="body1" 
              sx={{ 
                mr: 2,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {user?.nombre} {user?.apellido}
            </Typography>
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{ 
                p: 0,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
              }}
            >
              {renderAvatar()}
            </IconButton>
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            onClick={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                '& .MuiMenuItem-root': {
                  px: 2,
                  py: 1,
                },
              },
            }}
          >
            <MenuItem onClick={handleProfileClick}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Mi Perfil
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar para pantallas grandes */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            backgroundColor: '#ffffff',
            overflowX: 'hidden'
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Sidebar móvil */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            overflowX: 'hidden'
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          backgroundColor: '#f0f2f5',
          minHeight: 'calc(100vh - 64px)'
        }}
      >
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: 'calc(100vh - 64px)' 
          }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: 1,
            p: { xs: 2, sm: 3 },
            minHeight: 'calc(100vh - 100px)'
          }}>
            {children}
          </Box>
        )}
      </Box>

      <Profile 
        open={openProfile} 
        onClose={() => {
          setOpenProfile(false);
          setAvatarError(false);
        }} 
      />
    </Box>
  );
};

export default Layout; 