'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add fc_id column to scanner_sku table
    await queryInterface.addColumn('scanner_sku', 'fc_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Fulfillment Center ID from auth token'
    });

    // Add fc_id column to scanner_bin table
    await queryInterface.addColumn('scanner_bin', 'fc_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Fulfillment Center ID from auth token'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove fc_id column from scanner_sku table
    await queryInterface.removeColumn('scanner_sku', 'fc_id');

    // Remove fc_id column from scanner_bin table
    await queryInterface.removeColumn('scanner_bin', 'fc_id');
  }
};
