const express = require('express');
const router = express.Router();
const { 
  getPagos, 
  getPagosByContrato, 
  getPagosByCliente,
  getResumenPagosCliente,
  registrarPago,
  simularPagoAutomatico 
} = require('../controllers/pagoController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Rutas protegidas
router.use(verifyToken);

// Obtener todos los pagos
router.get('/', getPagos);

// Obtener pagos por contrato
router.get('/contrato/:contratoId', getPagosByContrato);

// Obtener pagos del cliente autenticado
router.get('/cliente', getPagosByCliente);

// Obtener resumen de pagos del cliente autenticado
router.get('/cliente/resumen', getResumenPagosCliente);

// Registrar pago
router.post('/:pagoId/registrar', registrarPago);

// Simular pago automático (para pruebas)
router.post('/:pagoId/simular', simularPagoAutomatico);

module.exports = router; 