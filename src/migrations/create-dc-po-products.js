'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('dc_po_products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      dcPOId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'dc_purchase_orders',
          key: 'id'
        }
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'parent_product_master_dc',
          key: 'id'
        }
      },
      sku: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      productName: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      unitPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      totalAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      mrp: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('dc_po_products');
  }
};
