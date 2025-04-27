'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if the ENUM type already exists
    const enumExists = await queryInterface.sequelize.query(
      `SELECT 1 FROM pg_type WHERE typname = 'enum_shop_loans_status';`
    );

    if (enumExists[0].length === 0) {
      // Create ENUM type if it does not exist
      await queryInterface.sequelize.query(
        `CREATE TYPE enum_shop_loans_status AS ENUM ('active', 'completed', 'defaulted');`
      );
    }

    // Check if the status column already exists
    const columnExists = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_loans' AND column_name = 'status';`
    );

    if (columnExists[0].length === 0) {
      // Add the column if it does not exist
      await queryInterface.sequelize.query(
        `ALTER TABLE shop_loans ADD COLUMN status enum_shop_loans_status NOT NULL DEFAULT 'active';`
      );
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TABLE shop_loans DROP COLUMN status;`
    );
    await queryInterface.sequelize.query(
      `DROP TYPE enum_shop_loans_status;`
    );
  }
};
