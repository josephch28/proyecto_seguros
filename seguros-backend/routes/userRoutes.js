const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  getUserById,
  updateProfile,
  getUsersByRole,
  getClients
} = require('../controllers/userController');
const { verifyAdmin, verifyToken, verifyAgent } = require('../middlewares/authMiddleware');
const { 
  validateUserInput, 
  validateId 
} = require('../middlewares/validationMiddleware');

// Configuración de multer para la subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Límite de 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('El archivo debe ser una imagen'));
        }
    }
});

// Rutas específicas primero
router.get('/roles', verifyAdmin, getRoles);
router.get('/users', verifyAdmin, getUsersByRole);

// Rutas para gestión de clientes por agentes
router.get('/clientes', verifyToken, getClients);
router.post('/clientes', verifyToken, verifyAgent, createUser);
router.put('/clientes/:id', verifyToken, verifyAgent, updateUser);
router.delete('/clientes/:id', verifyToken, verifyAgent, deleteUser);

// Rutas protegidas que requieren rol de administrador
router.get('/', verifyAdmin, getUsers);

// Rutas de perfil (protegidas por verifyToken)
router.put('/profile', [verifyToken, upload.single('foto_perfil'), validateUserInput], updateProfile);

// Rutas con parámetros al final
router.get('/:id', validateId, getUserById);
router.put('/:id', [verifyAdmin, validateId, validateUserInput], updateUser);
router.delete('/:id', [verifyAdmin, validateId], deleteUser);

module.exports = router;