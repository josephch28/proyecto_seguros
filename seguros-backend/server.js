const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const app = express();

// Configuración de logging
app.use(morgan('dev'));
app.use((req, res, next) => {
    console.log('\n=== NUEVA PETICIÓN ===');
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware CORS manual para permitir PATCH
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000', 'https://proyecto-seguros-ucb5.vercel.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/contratos', require('./routes/contratoRoutes'));
app.use('/api/seguros', require('./routes/seguroRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/agent', require('./routes/agentRoutes'));
console.log('Registrando rutas de reembolsos...');
app.use('/api/reembolsos', require('./routes/reembolsoRoutes'));

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error en la aplicación:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n=== SERVIDOR INICIADO ===`);
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Directorio de uploads: ${path.join(__dirname, 'uploads')}`);
    console.log('========================\n');
}); 