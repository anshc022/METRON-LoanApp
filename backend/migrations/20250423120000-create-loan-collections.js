module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('loan_collections', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      collection_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      amount_collected: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      payment_mode: {
        type: Sequelize.ENUM('cash', 'upi', 'bank_transfer'),
        allowNull: false,
      },
      loan_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'loans',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      collected_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('loan_collections');
  },
};