const express = require('express');
const router = express.Router();
const reembolsoController = require('../controllers/reembolsoController');
const { verifyToken } = require('../middlewares/authMiddleware');
const multer = require('multer');

// Configuración de multer para recibir buffer en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.use(verifyToken);

// Listar reembolsos (agente: todos, cliente: solo suyos)
router.get('/', reembolsoController.listar);

// Crear nuevo reembolso
router.post('/', upload.single('comprobante'), reembolsoController.crear);

// Subir comprobante
router.post('/:id/comprobante', upload.single('comprobante'), reembolsoController.subirComprobante);

// Ver comprobante
router.get('/:id/comprobante', reembolsoController.verComprobante);

// Cambiar estado (aprobado/rechazado)
router.patch('/:id/estado', reembolsoController.cambiarEstado);

router.get('/test', (req, res) => res.json({ ok: true }));

module.exports = router; 