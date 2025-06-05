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
  updateProfile
} = require('../controllers/userController');
const { verifyAdmin } = require('../middlewares/authMiddleware');
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

// Rutas protegidas que requieren rol de administrador
router.get('/', verifyAdmin, getUsers);

// Ruta para obtener roles - debe ir antes de las rutas con parámetros
router.get('/roles', verifyAdmin, getRoles);

router.get('/:id', validateId, getUserById);

router.post('/', [verifyAdmin, validateUserInput], createUser);

// Rutas de perfil (deben ir antes de las rutas con parámetros)
router.put('/profile', [upload.single('foto_perfil'), validateUserInput], updateProfile);

// Rutas con parámetros
router.put('/:id', [verifyAdmin, validateId, validateUserInput], updateUser);
router.delete('/:id', [verifyAdmin, validateId], deleteUser);

module.exports = router;