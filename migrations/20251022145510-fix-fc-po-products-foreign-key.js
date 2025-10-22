'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Drop the old foreign key constraint that references parent_product_master
    await queryInterface.removeConstraint('fc_po_products', 'fc_po_products_ibfk_2');
    
    // Add new foreign key constraint that references product_master
    await queryInterface.addConstraint('fc_po_products', {
      fields: ['product_id'],
      type: 'foreign key',
      name: 'fc_po_products_product_id_fk',
      references: {
        table: 'product_master',
        field: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  },

  async down (queryInterface, Sequelize) {
    // Drop the new foreign key constraint
    await queryInterface.removeConstraint('fc_po_products', 'fc_po_products_product_id_fk');
    
    // Restore the old foreign key constraint (if parent_product_master table exists)
    await queryInterface.addConstraint('fc_po_products', {
      fields: ['product_id'],
      type: 'foreign key',
      name: 'fc_po_products_ibfk_2',
      references: {
        table: 'parent_product_master',
        field: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  }
};
