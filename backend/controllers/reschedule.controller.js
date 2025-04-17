const { User, Loan, Shop, Reschedule } = require("../models");
const { Op } = require("sequelize");
// create reschedue to a loan 
exports.createReschedule = async (req, res) => {
    try {
      const { loan_id, new_due_date, reason } = req.body;
      const user = req.user; // JWT decoded user (has id and role)

        // Basic validation
        if (!loan_id || !new_due_date || !reason) {
          return res.status(400).json({
            success: false,
            message: "Invalid input. Please provide all required fields.",
          });
        }
    
      // through error if the new_due_date is in past
        const currentDate = new Date();
        if (new_due_date < currentDate) {
          return res.status(400).json({
            success: false,
            message: "New due date cannot be in the past",
          });
        }

      // Find the loan
      const loan = await Loan.findByPk(loan_id);
      if (!loan) {
        return res.status(404).json({ success: false, message: 'Loan not found' });
      }
  
      // Fetch the associated shop to validate agent ownership
      const shop = await Shop.findByPk(loan.shop_id);
      if (!shop) {
        return res.status(404).json({ success: false, message: 'Associated shop not found' });
      }
  
      // 🔒 Restrict agent if shop doesn't belong to them
      if (user.role === 'agent' && shop.agent_id !== user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to reschedule this loan' });
      }
  
      const old_due_date = loan.due_date;
  
      // Create the reschedule record
      await Reschedule.create({
        loan_id,
        old_due_date,
        new_due_date,
        reason,
        rescheduled_by: user.id
      });
  
      // Update loan's due date
      loan.due_date = new_due_date;
      await loan.save();
  
      res.status(200).json({
        success: true,
        message: 'Loan due date rescheduled successfully'
      });
  
    } catch (error) {
      console.error('Error during loan reschedule:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };

  //get all reschedules
  exports.getAllReschedules = async (req, res) => {
    try {
      const user = req.user;
      const whereClause = {};
  
      if (user.role === 'agent') {
        // Get loans for shops where agent_id = logged in user
        const agentLoans = await Loan.findAll({
          include: {
            model: Shop,
            where: { agent_id: user.id },
            attributes: []
          },
          attributes: ['id']
        });
  
        const loanIds = agentLoans.map(loan => loan.id);
  
        whereClause[Op.or] = [
          { rescheduled_by: user.id },
          { loan_id: loanIds }
        ];
      }
  
      const reschedules = await Reschedule.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            foreignKey: 'rescheduled_by',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Loan,
            attributes: ['id'],
            include: [
              {
                model: Shop,
                attributes: ['id', 'name', 'location']
              }
            ]
          }
        ],
        order: [['reschedule_date', 'DESC']]
      });
  
      res.status(200).json({
        success: true,
        reschedule_count: reschedules.length,
        reschedules: reschedules.map(r => ({
          id: r.id,
          old_due_date: r.old_due_date,
          new_due_date: r.new_due_date,
          reschedule_date: r.reschedule_date,
          reason: r.reason,
          rescheduled_by: r.User ? {
            id: r.User.id,
            name: r.User.name,
            email: r.User.email
          } : null,
          loan: r.Loan ? {
            id: r.Loan.id,
            shop: r.Loan.Shop ? {
              id: r.Loan.Shop.id,
              name: r.Loan.Shop.name,
              location: r.Loan.Shop.location
            } : null
          } : null
        }))
      });
  
    } catch (error) {
      console.error('Error fetching reschedules:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };