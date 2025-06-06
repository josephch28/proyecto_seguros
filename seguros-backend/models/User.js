const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('seguros_db', 'root', '', {
  host: 'localhost',
  dialect: 'mysql'
});

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: false
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'correo'
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'contrasena'
  },
  rol: {
    type: DataTypes.ENUM('admin', 'agente', 'cliente'),
    allowNull: false,
    field: 'rol_id'
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo'),
    defaultValue: 'activo'
  }
}, {
  tableName: 'usuarios',
  timestamps: true
});

module.exports = User;
