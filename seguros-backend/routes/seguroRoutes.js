const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const {
    getSeguros,
    getSeguroById,
    createSeguro,
    updateSeguro,
    deactivateSeguro,
    getTiposSeguro
} = require('../controllers/seguroController');

// Rutas públicas
router.get('/tipos', getTiposSeguro);
router.get('/', getSeguros);
router.get('/:id', getSeguroById);

// Rutas protegidas (solo administrador)
router.post('/', verifyToken, verifyAdmin, createSeguro);
router.put('/:id', verifyToken, verifyAdmin, updateSeguro);
router.delete('/:id', verifyToken, verifyAdmin, deactivateSeguro);

module.exports = router; 