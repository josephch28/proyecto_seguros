import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

const TopBar = () => {
  return (
    <AppBar position="static" sx={{ bgcolor: '#1e3a5f', boxShadow: 3 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          GOSafe Seguros
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar; 