'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('dc_po_approvals', {
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
      approverRole: {
        type: Sequelize.ENUM('creator', 'category_head', 'admin', 'founder'),
        allowNull: false
      },
      approverId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      approverEmail: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      action: {
        type: Sequelize.ENUM('APPROVED', 'REJECTED', 'PENDING'),
        allowNull: false,
        defaultValue: 'PENDING'
      },
      comments: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      approvedAt: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('dc_po_approvals');
  }
};
