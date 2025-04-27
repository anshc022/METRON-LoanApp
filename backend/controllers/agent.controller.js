const { User, Shop, Loan, Collection } = require("../models");
const { Op, Sequelize } = require("sequelize");

exports.getDashboardStats = async (req, res) => {
  try {
    const agentId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalShops,
      activeLoans,
      { todayTarget },
      collectedToday,
      dueLoans
    ] = await Promise.all([
      // Get shops count for this agent
      Shop.count({
        where: { agent_id: agentId }
      }),

      // Get active loans count
      Loan.count({
        include: [{
          model: Shop,
          required: true,
          where: { agent_id: agentId },
          attributes: []
        }],
        where: {
          status: 'active'
        }
      }),

      // Calculate today's target using subquery
      Loan.findOne({
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('amount')), 'todayTarget']
        ],
        include: [{
          model: Shop,
          required: true,
          where: { agent_id: agentId },
          attributes: []
        }],
        where: {
          status: 'active'
        },
        raw: true
      }),

      // Get today's collections using subquery
      Collection.findOne({
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('amount_collected')), 'collectedToday']
        ],
        where: {
          collection_date: {
            [Op.eq]: today.toISOString().split('T')[0]
          }
        },
        include: [{
          model: Loan,
          required: true,
          attributes: [],
          include: [{
            model: Shop,
            required: true,
            where: { agent_id: agentId },
            attributes: []
          }]
        }],
        raw: true
      }),

      // Get loans due today
      Loan.findAll({
        include: [{
          model: Shop,
          required: true,
          where: { agent_id: agentId },
          attributes: ['name']
        }],
        where: {
          status: 'active',
          due_date: {
            [Op.lte]: today
          }
        },
        attributes: ['id', 'amount', 'due_date']
      })
    ]);

    res.json({
      success: true,
      data: {
        totalShops,
        activeLoans,
        todayTarget: todayTarget || 0,
        collectedToday: Number(collectedToday?.collectedToday || 0),
        dueLoans: dueLoans.map(loan => ({
          id: loan.id,
          amount: loan.amount,
          due_date: loan.due_date,
          shopName: loan.Shop.name
        }))
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Some error occurred while retrieving dashboard stats.'
    });
  }
};

exports.getTodayCollections = async (req, res) => {
  try {
    const agentId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const collections = await Collection.findAll({
      include: [{
        model: Loan,
        required: true,
        attributes: ['amount'],
        include: [{
          model: Shop,
          required: true,
          where: { agent_id: agentId },
          attributes: ['name']
        }]
      }],
      where: {
        collection_date: today
      },
      attributes: ['id', 'amount_collected', 'collection_date'],
      order: [['collection_date', 'DESC']]
    });

    // Format the collections according to the frontend's expected structure
    const formattedCollections = collections.map(collection => ({
      id: collection.id,
      shopName: collection.Loan.Shop.name,
      amount: Number(collection.Loan.amount),
      status: Number(collection.amount_collected) > 0 ? 'collected' : 'pending',
      date: collection.collection_date
    }));

    res.status(200).json({
      success: true,
      data: formattedCollections
    });
  } catch (error) {
    console.error("Today's collections error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};