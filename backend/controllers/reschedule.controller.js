const { Reschedule, Loan, Shop, User } = require("../models");
const { Op } = require("sequelize");

// Create a new reschedule
exports.createReschedule = async (req, res) => {
  try {
    const { loan_id, new_due_date, reason } = req.body;
    const user = req.user;

    // Basic validation
    if (!loan_id || !new_due_date || !reason) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Find the loan with its shop
    const loan = await Loan.findByPk(loan_id, {
      include: { model: Shop }
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // 🔒 Restrict agent if shop doesn't belong to them
    if (user.role === 'agent' && loan.Shop.agent_id !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to reschedule this loan'
      });
    }

    const old_due_date = loan.due_date;

    // Create the reschedule record
    const reschedule = await Reschedule.create({
      loan_id,
      old_due_date,
      new_due_date,
      reason,
      rescheduled_by: user.id
    });

    // Update loan's due date
    await loan.update({ due_date: new_due_date });

    // Fetch created reschedule with relationships
    const rescheduleWithRelations = await Reschedule.findByPk(reschedule.id, {
      include: [
        {
          model: Loan,
          include: {
            model: Shop,
            include: {
              model: User,
              attributes: ['id', 'name', 'email', 'location'],
              as: 'User'
            }
          }
        },
        {
          model: User,
          attributes: ['id', 'name', 'email'],
          as: 'Rescheduler'
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Loan rescheduled successfully',
      data: {
        id: rescheduleWithRelations.id,
        loan_id: rescheduleWithRelations.loan_id,
        old_due_date: rescheduleWithRelations.old_due_date,
        new_due_date: rescheduleWithRelations.new_due_date,
        reschedule_date: rescheduleWithRelations.reschedule_date,
        reason: rescheduleWithRelations.reason,
        rescheduled_by: rescheduleWithRelations.rescheduled_by,
        loan: rescheduleWithRelations.Loan ? {
          id: rescheduleWithRelations.Loan.id,
          amount: rescheduleWithRelations.Loan.amount,
          loan_date: rescheduleWithRelations.Loan.loan_date,
          due_date: rescheduleWithRelations.Loan.due_date,
          shop: rescheduleWithRelations.Loan.Shop ? {
            id: rescheduleWithRelations.Loan.Shop.id,
            name: rescheduleWithRelations.Loan.Shop.name,
            location: rescheduleWithRelations.Loan.Shop.location,
            agent: rescheduleWithRelations.Loan.Shop.User
          } : null
        } : null,
        rescheduler: rescheduleWithRelations.Rescheduler
      }
    });
  } catch (error) {
    console.error('Error in rescheduling loan:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all reschedules
exports.getAllReschedules = async (req, res) => {
  try {
    const user = req.user;

    // Base query options
    let queryOptions = {
      include: [
        {
          model: Loan,
          required: true, // INNER JOIN to ensure we only get reschedules with valid loans
          include: {
            model: Shop,
            required: true, // INNER JOIN to ensure we only get loans with valid shops
            include: {
              model: User,
              attributes: ['id', 'name', 'email', 'location'],
              as: 'User'
            }
          }
        },
        {
          model: User,
          attributes: ['id', 'name', 'email'],
          as: 'Rescheduler',
          required: true // INNER JOIN to ensure we only get reschedules with valid users
        }
      ],
      order: [['reschedule_date', 'DESC']]
    };

    // If agent, only show reschedules for their shops
    if (user.role === 'agent') {
      queryOptions.include[0].include.where = { agent_id: user.id };
    }

    const reschedules = await Reschedule.findAll(queryOptions);

    const formattedReschedules = reschedules.map(reschedule => ({
      id: reschedule.id,
      loan_id: reschedule.loan_id,
      old_due_date: reschedule.old_due_date,
      new_due_date: reschedule.new_due_date,
      reschedule_date: reschedule.reschedule_date,
      reason: reschedule.reason,
      rescheduled_by: reschedule.rescheduled_by,
      loan: reschedule.Loan ? {
        id: reschedule.Loan.id,
        amount: reschedule.Loan.amount,
        loan_date: reschedule.Loan.loan_date,
        due_date: reschedule.Loan.due_date,
        shop: reschedule.Loan.Shop ? {
          id: reschedule.Loan.Shop.id,
          name: reschedule.Loan.Shop.name,
          location: reschedule.Loan.Shop.location,
          agent: reschedule.Loan.Shop.User
        } : null
      } : null,
      rescheduler: reschedule.Rescheduler
    }));

    res.status(200).json({
      success: true,
      count: formattedReschedules.length,
      data: formattedReschedules
    });
  } catch (error) {
    console.error('Error fetching reschedules:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};