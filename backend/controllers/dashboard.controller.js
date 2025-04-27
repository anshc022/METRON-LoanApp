const { User } = require("../models");
const { Collection } = require("../models");
const { Loan } = require("../models");
const { Shop } = require("../models");
const { Op } = require("sequelize");

exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalLoans, activeLoans, totalShops, totalAgents, collections] = await Promise.all([
      Loan.count(),
      Loan.count({ where: { status: 'active' } }),
      Shop.count(),
      User.count({ where: { role: "agent" } }),
      Collection.findAll({
        include: [{
          model: Loan,
          include: [Shop]
        }]
      })
    ]);

    // Calculate total collections amount
    const totalCollectionsAmount = collections.reduce((sum, col) => 
      sum + Number(col.amount_collected || 0), 0);

    // Calculate today's collections
    const todayCollectionsAmount = collections
      .filter(col => {
        const colDate = new Date(col.collection_date);
        return colDate >= today && colDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      })
      .reduce((sum, col) => sum + Number(col.amount_collected || 0), 0);

    // Calculate pending collections
    const pendingCollections = collections.filter(col => 
      Number(col.amount_collected || 0) < Number(col.Loan?.amount || 0)
    ).length;

    const stats = {
      totalAgents,
      totalShops,
      totalLoans: activeLoans,
      totalCollections: totalCollectionsAmount,
      todayCollections: todayCollectionsAmount,
      pendingCollections
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    next(error);
  }
};

// Get today's collections
exports.getTodayCollections = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const collections = await Collection.findAll({
      where: {
        createdAt: {
          $gte: today
        }
      },
      include: [
        {
          model: Loan,
          include: [Shop]
        }
      ]
    });

    res.json({
      success: true,
      data: collections
    });
  } catch (error) {
    next(error);
  }
};