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
  Divider
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
  People as PeopleIcon
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

  useEffect(() => {
    console.log('Layout - User data:', user);
    console.log('Layout - Profile image URL:', user?.foto_perfil);
    if (user?.foto_perfil) {
      // Verificar si la imagen existe
      fetch(user.foto_perfil)
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
    }
  }, [user?.foto_perfil]);

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
    const userRole = user?.rol_nombre?.toLowerCase() || user?.rol?.toLowerCase();
    
    switch (userRole) {
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
          { text: 'Usuarios', path: '/admin/users', icon: <PeopleIcon /> },
          { text: 'Buscar Casos', path: '/admin/cases', icon: <SearchIcon /> },
          { text: 'Seguros', path: '/admin/insurances', icon: <SecurityIcon /> }
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
              <Avatar 
                key={avatarKey}
                sx={{ 
                  bgcolor: '#2c5282',
                  width: 40,
                  height: 40
                }}
                src={!avatarError && user?.foto_perfil ? user.foto_perfil : undefined}
                onError={handleAvatarError}
                imgProps={{
                  crossOrigin: "anonymous",
                  referrerPolicy: "no-referrer"
                }}
              >
                {(!user?.foto_perfil || avatarError) && user?.nombre?.charAt(0)?.toUpperCase()}
              </Avatar>
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