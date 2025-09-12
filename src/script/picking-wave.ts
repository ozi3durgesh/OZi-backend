import { QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Add the `orderId` column with a foreign key constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE picking_waves 
      ADD COLUMN orderId INT,
      ADD CONSTRAINT fk_order_id FOREIGN KEY (orderId) REFERENCES orders(id);
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    // The column can't be removed by dropping all rows, so we can leave it or avoid removing it
    // You can skip the down method if you don't want to allow it to be removed
    // Alternatively, you could use the following to drop the column if you want it to be removable:
    // await queryInterface.sequelize.query('ALTER TABLE picking_waves DROP COLUMN orderId;');
  },
};
