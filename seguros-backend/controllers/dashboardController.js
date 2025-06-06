const pool = require('../db');

const dashboardController = {
  getDashboardData: async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.rol_nombre.toLowerCase();

      let stats = {
        totalUsers: 0,
        totalInsurances: 0,
        totalContracts: 0,
        totalReimbursements: 0,
        recentContracts: [],
        pendingReimbursements: []
      };

      // Obtener estadísticas según el rol
      if (userRole === 'administrador') {
        // Total de usuarios
        const usersResult = await pool.query(
          'SELECT COUNT(*) FROM usuarios WHERE activo = true'
        );
        stats.totalUsers = parseInt(usersResult.rows[0].count);

        // Total de seguros activos
        const insurancesResult = await pool.query(
          'SELECT COUNT(*) FROM seguros WHERE activo = true'
        );
        stats.totalInsurances = parseInt(insurancesResult.rows[0].count);

        // Total de contratos activos
        const contractsResult = await pool.query(
          'SELECT COUNT(*) FROM contratos WHERE estado = $1',
          ['activo']
        );
        stats.totalContracts = parseInt(contractsResult.rows[0].count);

        // Total de reembolsos pendientes
        const reimbursementsResult = await pool.query(
          'SELECT COUNT(*) FROM reembolsos WHERE estado = $1',
          ['pendiente']
        );
        stats.totalReimbursements = parseInt(reimbursementsResult.rows[0].count);
      } else if (userRole === 'agente' || userRole === 'asesor') {
        // Contratos recientes del agente
        const recentContractsResult = await pool.query(
          `SELECT c.*, u.nombre as cliente_nombre, s.nombre as seguro_nombre
           FROM contratos c
           JOIN usuarios u ON c.cliente_id = u.id
           JOIN seguros s ON c.seguro_id = s.id
           WHERE c.agente_id = $1
           ORDER BY c.fecha_inicio DESC
           LIMIT 5`,
          [userId]
        );
        stats.recentContracts = recentContractsResult.rows;

        // Reembolsos pendientes del agente
        const pendingReimbursementsResult = await pool.query(
          `SELECT r.*, u.nombre as cliente_nombre
           FROM reembolsos r
           JOIN contratos c ON r.contrato_id = c.id
           JOIN usuarios u ON c.cliente_id = u.id
           WHERE c.agente_id = $1 AND r.estado = $2
           ORDER BY r.fecha_solicitud DESC
           LIMIT 5`,
          [userId, 'pendiente']
        );
        stats.pendingReimbursements = pendingReimbursementsResult.rows;
      } else if (userRole === 'cliente') {
        // Contratos activos del cliente
        const clientContractsResult = await pool.query(
          `SELECT c.*, s.nombre as seguro_nombre
           FROM contratos c
           JOIN seguros s ON c.seguro_id = s.id
           WHERE c.cliente_id = $1 AND c.estado = $2
           ORDER BY c.fecha_inicio DESC`,
          [userId, 'activo']
        );
        stats.recentContracts = clientContractsResult.rows;

        // Reembolsos del cliente
        const clientReimbursementsResult = await pool.query(
          `SELECT r.*
           FROM reembolsos r
           JOIN contratos c ON r.contrato_id = c.id
           WHERE c.cliente_id = $1
           ORDER BY r.fecha_solicitud DESC
           LIMIT 5`,
          [userId]
        );
        stats.pendingReimbursements = clientReimbursementsResult.rows;
      }

      res.json(stats);
    } catch (error) {
      console.error('Error en getDashboardData:', error);
      res.status(500).json({
        message: 'Error al obtener los datos del dashboard',
        error: error.message
      });
    }
  }
};

module.exports = dashboardController; 