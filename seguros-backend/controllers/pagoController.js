const pool = require('../config/database');

// Obtener todos los pagos
const getPagos = async (req, res) => {
  try {
    const [pagos] = await pool.query(`
      SELECT p.*, c.frecuencia_pago, c.monto_pago, c.cliente_id,
             u.nombre as nombre_cliente, u.apellido as apellido_cliente
      FROM pagos p
      JOIN contratos c ON p.contrato_id = c.id
      JOIN usuarios u ON c.cliente_id = u.id
      ORDER BY p.fecha_programada DESC
    `);
    res.json(pagos);
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ message: 'Error al obtener los pagos' });
  }
};

// Obtener pagos por contrato
const getPagosByContrato = async (req, res) => {
  try {
    const { contratoId } = req.params;
    const [pagos] = await pool.query(`
      SELECT * FROM pagos 
      WHERE contrato_id = ? 
      ORDER BY fecha_programada DESC
    `, [contratoId]);
    res.json(pagos);
  } catch (error) {
    console.error('Error al obtener pagos del contrato:', error);
    res.status(500).json({ message: 'Error al obtener los pagos del contrato' });
  }
};

// Programar próximo pago
const programarProximoPago = async (contratoId, ultimoPago) => {
  try {
    const [contrato] = await pool.query(
      'SELECT frecuencia_pago, monto_pago FROM contratos WHERE id = ?',
      [contratoId]
    );

    if (!contrato[0]) return;

    const { frecuencia_pago, monto_pago } = contrato[0];
    const fechaProximoPago = new Date(ultimoPago.fecha_programada);

    // Calcular la fecha del próximo pago según la frecuencia
    switch (frecuencia_pago) {
      case 'mensual':
        fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 1);
        break;
      case 'trimestral':
        fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 3);
        break;
      case 'semestral':
        fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 6);
        break;
    }

    // Insertar el próximo pago programado
    await pool.query(`
      INSERT INTO pagos (
        contrato_id, monto, fecha_programada, estado
      ) VALUES (?, ?, ?, 'pendiente')
    `, [contratoId, monto_pago, fechaProximoPago]);

  } catch (error) {
    console.error('Error al programar próximo pago:', error);
  }
};

// Registrar pago
const registrarPago = async (req, res) => {
  try {
    const { pagoId } = req.params;
    const { monto, fecha_pago, comprobante } = req.body;

    // Actualizar el pago actual
    await pool.query(`
      UPDATE pagos 
      SET monto = ?, fecha_pago = ?, comprobante = ?, estado = 'completado'
      WHERE id = ?
    `, [monto, fecha_pago, comprobante, pagoId]);

    // Obtener el contrato asociado al pago
    const [pago] = await pool.query(
      'SELECT contrato_id, fecha_programada FROM pagos WHERE id = ?',
      [pagoId]
    );

    if (pago[0]) {
      // Programar el próximo pago
      await programarProximoPago(pago[0].contrato_id, pago[0]);
    }

    res.json({ 
      success: true,
      message: 'Pago registrado exitosamente' 
    });
  } catch (error) {
    console.error('Error al registrar pago:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al registrar el pago' 
    });
  }
};

// Simular pago automático (para pruebas)
const simularPagoAutomatico = async (req, res) => {
  try {
    const { pagoId } = req.params;
    
    // Obtener información del pago
    const [pago] = await pool.query(
      'SELECT * FROM pagos WHERE id = ?',
      [pagoId]
    );

    if (!pago[0]) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    // Simular el pago automático
    const fechaPago = new Date();
    await pool.query(`
      UPDATE pagos 
      SET monto = monto, 
          fecha_pago = ?, 
          estado = 'completado',
          comprobante = 'Pago automático simulado'
      WHERE id = ?
    `, [fechaPago, pagoId]);

    // Programar el próximo pago
    await programarProximoPago(pago[0].contrato_id, pago[0]);

    res.json({
      success: true,
      message: 'Pago automático simulado exitosamente'
    });
  } catch (error) {
    console.error('Error al simular pago automático:', error);
    res.status(500).json({
      success: false,
      message: 'Error al simular el pago automático'
    });
  }
};

// Obtener pagos de un cliente específico
const getPagosByCliente = async (req, res) => {
  try {
    const clienteId = req.user.id; // ID del cliente desde el token JWT
    
    const [pagos] = await pool.query(`
      SELECT p.*, c.frecuencia_pago, c.monto_pago, s.nombre as nombre_seguro
      FROM pagos p
      JOIN contratos c ON p.contrato_id = c.id
      JOIN seguros s ON c.seguro_id = s.id
      WHERE c.cliente_id = ?
      ORDER BY p.fecha_pago DESC, p.created_at DESC
    `, [clienteId]);
    
    res.json(pagos);
  } catch (error) {
    console.error('Error al obtener pagos del cliente:', error);
    res.status(500).json({ message: 'Error al obtener los pagos' });
  }
};

// Obtener resumen de pagos del cliente
const getResumenPagosCliente = async (req, res) => {
  try {
    const clienteId = req.user.id; // ID del cliente desde el token JWT
    
    // Obtener total pagado
    const [totalPagado] = await pool.query(`
      SELECT COALESCE(SUM(p.monto), 0) as total_pagado
      FROM pagos p
      JOIN contratos c ON p.contrato_id = c.id
      WHERE c.cliente_id = ? AND p.estado = 'completado'
    `, [clienteId]);
    
    // Obtener pagos pendientes
    const [pagosPendientes] = await pool.query(`
      SELECT COUNT(*) as cantidad_pendientes
      FROM pagos p
      JOIN contratos c ON p.contrato_id = c.id
      WHERE c.cliente_id = ? AND p.estado = 'pendiente'
    `, [clienteId]);
    
    // Obtener próximo pago
    const [proximoPago] = await pool.query(`
      SELECT p.fecha_pago, p.monto, s.nombre as nombre_seguro
      FROM pagos p
      JOIN contratos c ON p.contrato_id = c.id
      JOIN seguros s ON c.seguro_id = s.id
      WHERE c.cliente_id = ? AND p.estado = 'pendiente'
      ORDER BY p.fecha_pago ASC
      LIMIT 1
    `, [clienteId]);
    
    res.json({
      totalPaid: totalPagado[0].total_pagado,
      pendingPayments: pagosPendientes[0].cantidad_pendientes,
      nextPaymentDate: proximoPago[0] ? proximoPago[0].fecha_pago : null,
      nextPaymentAmount: proximoPago[0] ? proximoPago[0].monto : null,
      nextPaymentInsurance: proximoPago[0] ? proximoPago[0].nombre_seguro : null
    });
  } catch (error) {
    console.error('Error al obtener resumen de pagos:', error);
    res.status(500).json({ message: 'Error al obtener el resumen de pagos' });
  }
};

module.exports = {
  getPagos,
  getPagosByContrato,
  getPagosByCliente,
  getResumenPagosCliente,
  registrarPago,
  simularPagoAutomatico
}; 