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
    obtenerDocumentosCliente,
    obtenerDocumentosBeneficiario,
    obtenerFirmaCliente,
    deleteContrato
} = require('../controllers/contratoController');
const multer = require('multer');

// Configurar multer para manejar archivos PDF
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Permitir PDFs y PNGs (para firmas)
        if (file.mimetype === 'application/pdf' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF y PNG'), false);
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
router.post('/', verifyToken, verifyClienteOrAgentOrAdmin, createContrato);
router.put('/:id/estado', verifyToken, verifyAgentOrAdmin, actualizarEstadoContrato);

// Rutas para documentos
router.put('/:id/documentos', 
    verifyToken, 
    verifyClienteOrAgentOrAdmin,
    upload.fields([
        { name: 'historia_medica', maxCount: 1 },
        { name: 'documentos_cliente', maxCount: 1 },
        { name: 'documentos_beneficiarios', maxCount: 10 },
        { name: 'firma_cliente', maxCount: 1 }
    ]), 
    updateContratoDocumentos
);

// Rutas para obtener documentos
router.get('/:id/historia-medica', verifyToken, obtenerHistoriaMedica);
router.get('/:id/documentos-cliente', verifyToken, obtenerDocumentosCliente);
router.get('/:id/beneficiario/:beneficiarioId/documentos', verifyToken, obtenerDocumentosBeneficiario);
router.get('/:id/firma', verifyToken, obtenerFirmaCliente);

// Rutas generales
router.get('/mis-contratos', verifyToken, getContratosByCliente);
router.put('/:id', verifyToken, verifyClienteOrAgentOrAdmin, updateContrato);
router.get('/:id', verifyToken, verifyClienteOrAgentOrAdmin, getContratoById);
router.get('/:id/detalles', verifyToken, verifyClienteOrAgentOrAdmin, getContratoDetalles);
router.delete('/:id', verifyToken, deleteContrato);

module.exports = router; 