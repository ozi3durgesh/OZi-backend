'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('dc_purchase_orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      poId: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      vendorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'vendor_dc',
          key: 'id'
        }
      },
      dcId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'DistributionCenters',
          key: 'id'
        }
      },
      totalAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      status: {
        type: Sequelize.ENUM(
          'DRAFT',
          'PENDING_CATEGORY_HEAD',
          'PENDING_ADMIN',
          'PENDING_CREATOR_REVIEW',
          'APPROVED',
          'REJECTED',
          'CANCELLED'
        ),
        allowNull: false,
        defaultValue: 'DRAFT'
      },
      priority: {
        type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
        allowNull: false,
        defaultValue: 'MEDIUM'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      approvedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      rejectedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      approvedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rejectedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
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
    await queryInterface.dropTable('dc_purchase_orders');
  }
};
