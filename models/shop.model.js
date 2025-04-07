// models/shop.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Shop = sequelize.define('Shop', {
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  owner_name: {
    type: DataTypes.STRING(100)
  },
  location: {
    type: DataTypes.STRING(100)
  }
}, {
  tableName: 'shops',
  timestamps: false
});

module.exports = Shop;
