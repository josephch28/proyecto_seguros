const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Seguro = sequelize.define('Seguro', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    tipo: {
        type: DataTypes.ENUM('medico', 'vida'),
        allowNull: false,
        validate: {
            isIn: [['medico', 'vida']]
        }
    },
    cobertura: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: true,
            min: 0
        }
    },
    beneficios: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    requisitos: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    precio_base: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: true,
            min: 0
        }
    },
    estado: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo',
        validate: {
            isIn: [['activo', 'inactivo']]
        }
    }
}, {
    timestamps: true,
    hooks: {
        beforeValidate: (seguro) => {
            // Validar cobertura según el tipo de seguro
            if (seguro.tipo === 'medico') {
                if (seguro.cobertura < 0 || seguro.cobertura > 100) {
                    throw new Error('La cobertura para seguros médicos debe ser un porcentaje entre 0 y 100');
                }
            } else if (seguro.tipo === 'vida') {
                if (seguro.cobertura <= 0) {
                    throw new Error('La cobertura para seguros de vida debe ser un monto mayor a 0');
                }
            }
        }
    }
});

module.exports = Seguro; 