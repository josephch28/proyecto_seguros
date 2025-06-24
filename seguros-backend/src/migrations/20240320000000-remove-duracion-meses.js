'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Seguros', 'duracion_meses');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Seguros', 'duracion_meses', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 12
    });
  }
}; 