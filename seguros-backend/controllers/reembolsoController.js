const Reembolso = require('../models/Reembolso');
const fileStorageService = require('../services/fileStorageService');

const reembolsoController = {
  async listar(req, res) {
    try {
      console.log('REQ.USER:', req.user);
      console.log('REQ.BODY:', req.body);
      const user = req.user;
      let reembolsos;
      if (user.rol === 'agente') {
        reembolsos = await Reembolso.obtenerTodos();
      } else if (user.rol === 'cliente') {
        reembolsos = await Reembolso.obtenerPorCliente(user.id);
      } else {
        return res.status(403).json({ message: 'No autorizado' });
      }
      res.json(reembolsos);
    } catch (err) {
      console.error('Error en listar reembolso:', err);
      res.status(500).json({ message: 'Error al obtener reembolsos', error: err.message });
    }
  },

  async crear(req, res) {
    try {
      const user = req.user;
      let { cliente_id, contrato_id, fecha_evento, tipo_gasto, monto, descripcion } = req.body;
      let creado_por = user.rol;
      let estado = user.rol === 'agente' ? 'aprobado' : 'pendiente';

      if (user.rol === 'cliente') {
        cliente_id = user.id;
      }

      // Validar archivo
      if (!req.file) {
        return res.status(400).json({ message: 'El comprobante es obligatorio' });
      }
      console.log('Archivo recibido:', req.file);
      let result;
      try {
        result = await fileStorageService.uploadFile(req.file, 'reembolsos');
        console.log('Resultado de uploadFile:', result);
      } catch (e) {
        console.error('Error subiendo archivo:', e);
        return res.status(500).json({ message: 'Error subiendo archivo', error: e.message });
      }

      let id;
      try {
        id = await Reembolso.crear({
          cliente_id,
          contrato_id,
          fecha_evento,
          tipo_gasto,
          monto,
          descripcion,
          archivo_comprobante: result.filePath,
          creado_por,
          estado
        });
        console.log('Reembolso creado con ID:', id);
      } catch (e) {
        console.error('Error insertando reembolso:', e);
        return res.status(500).json({ message: 'Error insertando reembolso', error: e.message });
      }
      res.status(201).json({ id });
    } catch (err) {
      res.status(500).json({ message: 'Error al crear reembolso', error: err.message });
    }
  },

  async subirComprobante(req, res) {
    try {
      const { id } = req.params;
      if (!req.file) return res.status(400).json({ message: 'Archivo requerido' });
      const result = await fileStorageService.uploadFile(req.file, 'reembolsos');
      await Reembolso.actualizarArchivo(id, result.filePath);
      res.json({ filePath: result.filePath });
    } catch (err) {
      res.status(500).json({ message: 'Error al subir comprobante', error: err.message });
    }
  },

  async verComprobante(req, res) {
    try {
      const { id } = req.params;
      const reembolso = await Reembolso.obtenerPorId(id);
      if (!reembolso || !reembolso.archivo_comprobante) {
        return res.status(404).json({ message: 'Comprobante no encontrado' });
      }
      const fileBuffer = await fileStorageService.getFile(reembolso.archivo_comprobante);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(fileBuffer);
    } catch (err) {
      res.status(500).json({ message: 'Error al obtener comprobante', error: err.message });
    }
  },

  async cambiarEstado(req, res) {
    try {
      const { id } = req.params;
      const { estado, comentario_revision } = req.body;
      if (!['aprobado', 'rechazado'].includes(estado)) {
        return res.status(400).json({ message: 'Estado inválido' });
      }
      await Reembolso.actualizarEstado(id, estado, comentario_revision);
      res.json({ message: 'Estado actualizado' });
    } catch (err) {
      res.status(500).json({ message: 'Error al actualizar estado', error: err.message });
    }
  }
};

module.exports = reembolsoController; 