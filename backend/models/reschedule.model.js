// models/reschedule.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Reschedule = sequelize.define('Reschedule', {
  loan_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  old_due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  new_due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  rescheduled_by: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'loan_reschedules',
  timestamps: true,
  createdAt: 'reschedule_date',
  updatedAt: false
});

module.exports = Reschedule;
