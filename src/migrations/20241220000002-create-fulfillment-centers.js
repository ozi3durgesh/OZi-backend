'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FulfillmentCenters', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      fc_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      dc_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'DistributionCenters',
          key: 'id',
        },
      },
      type: {
        type: Sequelize.ENUM('MAIN', 'SATELLITE', 'STOREFRONT', 'DISTRIBUTION'),
        allowNull: false,
        defaultValue: 'MAIN',
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'India',
      },
      pincode: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
      },
      contact_person: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      contact_email: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      contact_phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      emergency_contact: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      operational_hours: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      capacity_sqft: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      storage_capacity_units: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      current_utilization_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      services_offered: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      supported_fulfillment_types: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      is_auto_assignment_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      max_orders_per_day: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1000,
      },
      sla_hours: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 24,
      },
      lms_fc_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      integration_status: {
        type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED'),
        allowNull: false,
        defaultValue: 'PENDING',
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

    await queryInterface.addIndex('FulfillmentCenters', ['fc_code'], { unique: true });
    await queryInterface.addIndex('FulfillmentCenters', ['dc_id']);
    await queryInterface.addIndex('FulfillmentCenters', ['status']);
    await queryInterface.addIndex('FulfillmentCenters', ['type']);
    await queryInterface.addIndex('FulfillmentCenters', ['city', 'state']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('FulfillmentCenters');
  }
};
