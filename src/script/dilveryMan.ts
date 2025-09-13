// migrations/XXXXXXXXXXXXXX-create-delivery-men.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('delivery_men', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      f_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      l_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      identity_number: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
      identity_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      identity_image: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      image: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      password: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      auth_token: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      fcm_token: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      zone_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: true,
      },
      status: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      earning: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      current_orders: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      type: {
        type: Sequelize.STRING(191),
        allowNull: false,
        defaultValue: 'zone_wise',
      },
      store_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      application_status: {
        type: Sequelize.ENUM('approved', 'denied', 'pending'),
        allowNull: false,
        defaultValue: 'approved',
      },
      order_count: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      assigned_order_count: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      vehicle_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('delivery_men');
  }
};
