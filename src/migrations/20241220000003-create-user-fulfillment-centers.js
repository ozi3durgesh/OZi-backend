'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserFulfillmentCenters', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      fc_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'FulfillmentCenters',
          key: 'id',
        },
      },
      role: {
        type: Sequelize.ENUM('MANAGER', 'SUPERVISOR', 'OPERATOR', 'PICKER', 'PACKER', 'VIEWER'),
        allowNull: false,
        defaultValue: 'OPERATOR',
      },
      assigned_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('UserFulfillmentCenters', ['user_id', 'fc_id'], { unique: true });
    await queryInterface.addIndex('UserFulfillmentCenters', ['user_id']);
    await queryInterface.addIndex('UserFulfillmentCenters', ['fc_id']);
    await queryInterface.addIndex('UserFulfillmentCenters', ['is_active']);
    await queryInterface.addIndex('UserFulfillmentCenters', ['is_default']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserFulfillmentCenters');
  }
};
