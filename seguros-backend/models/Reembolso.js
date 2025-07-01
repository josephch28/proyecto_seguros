const db = require('../config/db');

const Reembolso = {
  async crear({ cliente_id, contrato_id, fecha_evento, tipo_gasto, monto, descripcion, archivo_comprobante, creado_por, estado }) {
    const [result] = await db.query(
      `INSERT INTO reembolsos (cliente_id, contrato_id, fecha_evento, tipo_gasto, monto, descripcion, archivo_comprobante, creado_por, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cliente_id, contrato_id, fecha_evento, tipo_gasto, monto, descripcion, archivo_comprobante, creado_por, estado]
    );
    return result.insertId;
  },

  async obtenerTodos() {
    const [rows] = await db.query(
      `SELECT r.*, u.nombre AS cliente_nombre, ct.id AS contrato_id
       FROM reembolsos r
       JOIN usuarios u ON r.cliente_id = u.id
       JOIN contratos ct ON r.contrato_id = ct.id`
    );
    return rows;
  },

  async obtenerPorCliente(cliente_id) {
    const [rows] = await db.query(
      `SELECT r.*, u.nombre AS cliente_nombre, ct.id AS contrato_id
       FROM reembolsos r
       JOIN usuarios u ON r.cliente_id = u.id
       JOIN contratos ct ON r.contrato_id = ct.id
       WHERE r.cliente_id = ?`,
      [cliente_id]
    );
    return rows;
  },

  async obtenerPorId(id) {
    const [rows] = await db.query(
      `SELECT * FROM reembolsos WHERE id = ?`, [id]
    );
    return rows[0];
  },

  async actualizarArchivo(id, archivo_comprobante) {
    await db.query(
      `UPDATE reembolsos SET archivo_comprobante = ?, estado = 'pendiente' WHERE id = ?`,
      [archivo_comprobante, id]
    );
  },

  async actualizarEstado(id, estado, comentario_revision = null) {
    await db.query(
      `UPDATE reembolsos SET estado = ?, fecha_revision = NOW(), comentario_revision = ? WHERE id = ?`,
      [estado, comentario_revision, id]
    );
  }
};

module.exports = Reembolso; 