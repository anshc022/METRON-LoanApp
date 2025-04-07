// models/loan.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Loan = sequelize.define('Loan', {
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  loan_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
}, {
  tableName: 'shop_loans',
  timestamps: false
});

module.exports = Loan;
