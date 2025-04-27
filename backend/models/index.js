// models/index.js
const sequelize = require('../config/db');
const User = require('./user.model')
const Shop = require('./shop.model')
const Loan = require('./loan.model')
const Collection = require('./collection.model')
const Reschedule = require('./reschedule.model')

// Shop Associations
User.hasMany(Shop, { foreignKey: 'agent_id', as: 'AssignedShops' });
Shop.belongsTo(User, { foreignKey: 'agent_id', as: 'User' });

// Loan Associations
Shop.hasMany(Loan, { foreignKey: 'shop_id' });
Loan.belongsTo(Shop, { foreignKey: 'shop_id' });

User.hasMany(Loan, { foreignKey: 'created_by', as: 'CreatedLoans' });
Loan.belongsTo(User, { foreignKey: 'created_by', as: 'Creator' });

// Collection Associations
Loan.hasMany(Collection, { foreignKey: 'loan_id' });
Collection.belongsTo(Loan, { foreignKey: 'loan_id' });

User.hasMany(Collection, { foreignKey: 'collected_by', as: 'Collections' });
Collection.belongsTo(User, { foreignKey: 'collected_by', as: 'User' });

// Reschedule Associations
Loan.hasMany(Reschedule, { foreignKey: 'loan_id' });
Reschedule.belongsTo(Loan, { foreignKey: 'loan_id', include: [{ model: Shop }] });

User.hasMany(Reschedule, { foreignKey: 'rescheduled_by', as: 'Reschedules' });
Reschedule.belongsTo(User, { foreignKey: 'rescheduled_by', as: 'Rescheduler' });

module.exports = {
  sequelize,
  User,
  Shop,
  Loan,
  Collection,
  Reschedule
};
