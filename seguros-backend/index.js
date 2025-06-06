require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const seguroRoutes = require('./routes/seguroRoutes');
const contratoRoutes = require('./routes/contratoRoutes');
const pagoRoutes = require('./routes/pagoRoutes');
const { verifyToken } = require('./middlewares/authMiddleware');
const pool = require('./config/database');
console.log('Tipo de verifyToken:', typeof verifyToken);

const app = express();

// Configuración de CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Agregar middleware para logging de rutas
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Crear directorio de uploads si no existe
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configurar cabeceras para archivos estáticos
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('uploads'));

// Prueba de conexión a la base de datos
pool.query('SELECT 1')
  .then(() => {
    console.log('Conexión a la base de datos establecida correctamente');
  })
  .catch(err => {
    console.error('Error al conectar con la base de datos:', err);
  });

app.use('/api/auth', authRoutes);
app.use('/api/users', verifyToken, userRoutes);
app.use('/api/seguros', seguroRoutes);
app.use('/api/contratos', contratoRoutes);
app.use('/api/pagos', pagoRoutes);

// Middleware para manejo de errores de multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'El archivo es demasiado grande' });
    }
    return res.status(400).json({ message: 'Error al subir el archivo' });
  }
  next(err);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});