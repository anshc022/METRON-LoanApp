// models/collection.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Collection = sequelize.define('Collection', {
  collection_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  amount_collected: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_mode: {
    type: DataTypes.ENUM('cash', 'upi', 'bank_transfer'),
    allowNull: false
  }
}, {
  tableName: 'loan_collections',
  timestamps: false
});

module.exports = Collection;
