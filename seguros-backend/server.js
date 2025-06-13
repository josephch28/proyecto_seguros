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

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/contratos', require('./routes/contratoRoutes'));
app.use('/api/seguros', require('./routes/seguroRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/agent', require('./routes/agentRoutes'));

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