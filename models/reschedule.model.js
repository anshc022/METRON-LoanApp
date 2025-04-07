// models/reschedule.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Reschedule = sequelize.define('Reschedule', {
  old_due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  new_due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  reschedule_date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  reason: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'loan_reschedules',
  timestamps: false
});

module.exports = Reschedule;
