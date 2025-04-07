// models/index.js
const sequelize = require('../config/db');
const User = require('./user.model')
const Shop = require('./shop.model')
const Loan = require('./loan.model')
const Collection = require('./collection.model')
const Reschedule = require('./reschedule.model')


// Define associations here
User.hasMany(Shop, { foreignKey: 'agent_id' });
Shop.belongsTo(User, { foreignKey: 'agent_id' });

Shop.hasMany(Loan, { foreignKey: 'shop_id' });
Loan.belongsTo(Shop, { foreignKey: 'shop_id' });

Loan.hasMany(Collection, { foreignKey: 'loan_id' });
Collection.belongsTo(Loan, { foreignKey: 'loan_id' });

User.hasMany(Collection, { foreignKey: 'collected_by' });
Collection.belongsTo(User, { foreignKey: 'collected_by' });

Loan.hasMany(Reschedule, { foreignKey: 'loan_id' });
Reschedule.belongsTo(Loan, { foreignKey: 'loan_id' });

User.hasMany(Loan, { foreignKey: 'created_by' });
User.hasMany(Reschedule, { foreignKey: 'rescheduled_by' });

module.exports = {
  sequelize,
  User,
  Shop,
  Loan,
  Collection,
  Reschedule
};
