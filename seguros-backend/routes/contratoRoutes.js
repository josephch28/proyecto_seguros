const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin, verifyAgentOrAdmin, verifyClienteOrAgentOrAdmin } = require('../middlewares/authMiddleware');
const {
    getContratos,
    getContratosByCliente,
    getContratosByAgente,
    createContrato,
    actualizarEstadoContrato,
    getBeneficiarios,
    getPagos,
    registrarPago,
    updateContratoDocumentos,
    getContratoDetalles,
    updateContrato,
    getContratoById,
    obtenerHistoriaMedica,
    deleteContrato
} = require('../controllers/contratoController');
const multer = require('multer');

// Configurar multer para manejar archivos PDF
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB límite
        fieldSize: 10 * 1024 * 1024 // 10MB límite para campos
    }
});

// Rutas para administradores y agentes
router.get('/', verifyToken, verifyAgentOrAdmin, getContratos);
router.get('/cliente/:clienteId', verifyToken, verifyAgentOrAdmin, getContratosByCliente);
router.get('/agente/:agenteId', verifyToken, verifyAgentOrAdmin, getContratosByAgente);
router.post('/', verifyToken, verifyAgentOrAdmin, createContrato);
router.put('/:id/estado', verifyToken, verifyAgentOrAdmin, actualizarEstadoContrato);

// Rutas para documentos
router.put('/:id/documentos', verifyToken, upload.single('historia_medica'), updateContratoDocumentos);
router.get('/:id/historia-medica', verifyToken, obtenerHistoriaMedica);

// Rutas generales
router.get('/mis-contratos', verifyToken, getContratosByCliente);
router.put('/:id', verifyToken, verifyClienteOrAgentOrAdmin, updateContrato);
router.get('/:id', verifyToken, verifyClienteOrAgentOrAdmin, getContratoById);
router.get('/:id/detalles', verifyToken, verifyClienteOrAgentOrAdmin, getContratoDetalles);
router.delete('/:id', verifyToken, deleteContrato);

// Rutas para documentos
router.get('/:id/documentos/historia-medica', verifyToken, obtenerHistoriaMedica);
router.put('/:id/documentos', verifyToken, updateContratoDocumentos);

module.exports = router; 