const { Loan, Shop, User } = require("../models");

exports.getAllLoans = async (req, res) => {
  try {
    let loans;
    
    if (req.user.role === 'admin') {
      // Admin can see all loans
      loans = await Loan.findAll({
        include: [{
          model: Shop,
          attributes: ['name', 'owner_name']
        }]
      });
    } else {
      // Agent can only see loans for their assigned shops
      loans = await Loan.findAll({
        include: [{
          model: Shop,
          where: { agent_id: req.user.id },
          attributes: ['name', 'owner_name']
        }]
      });
    }

    res.status(200).json({
      success: true,
      data: loans.map(loan => ({
        ...loan.toJSON(),
        shop_name: loan.Shop?.name || null
      }))
    });
  } catch (err) {
    console.error("Error fetching loans:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.getLoanById = async (req, res) => {
  try {
    const { id } = req.params;
    let loan;

    if (req.user.role === 'admin') {
      // Admin can see any loan
      loan = await Loan.findByPk(id, {
        include: [{
          model: Shop,
          attributes: ['name', 'owner_name']
        }]
      });
    } else {
      // Agent can only see loans for their assigned shops
      loan = await Loan.findOne({
        where: { id },
        include: [{
          model: Shop,
          where: { agent_id: req.user.id },
          attributes: ['name', 'owner_name']
        }]
      });
    }

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...loan.toJSON(),
        shop_name: loan.Shop?.name || null
      }
    });
  } catch (err) {
    console.error("Error fetching loan:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.createLoan = async (req, res) => {
  try {
    const { amount, loan_date, due_date, shop_id } = req.body;

    // Verify shop exists and agent has access
    const shop = await Shop.findByPk(shop_id);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found"
      });
    }

    // If agent, verify shop is assigned to them
    if (req.user.role === 'agent' && shop.agent_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to create loan for this shop"
      });
    }

    const loan = await Loan.create({
      amount,
      loan_date,
      due_date,
      shop_id,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: "Loan created successfully",
      data: {
        ...loan.toJSON(),
        shop_name: shop.name
      }
    });
  } catch (err) {
    console.error("Create loan error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.updateLoanById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find the loan with shop information
    let loan = await Loan.findOne({
      where: { id },
      include: [{
        model: Shop,
        attributes: ['name', 'owner_name', 'agent_id']
      }]
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found"
      });
    }

    // Check authorization
    if (req.user.role === 'agent' && loan.Shop.agent_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this loan"
      });
    }

    // Update the loan
    await loan.update(updates);

    res.status(200).json({
      success: true,
      message: "Loan updated successfully",
      data: {
        ...loan.toJSON(),
        shop_name: loan.Shop?.name || null
      }
    });
  } catch (err) {
    console.error("Update loan error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.deleteLoanById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the loan with shop information
    const loan = await Loan.findOne({
      where: { id },
      include: [{
        model: Shop,
        attributes: ['agent_id']
      }]
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found"
      });
    }

    // Only admin can delete loans, agents cannot
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete loans"
      });
    }

    await loan.destroy();

    res.status(200).json({
      success: true,
      message: "Loan deleted successfully"
    });
  } catch (err) {
    console.error("Delete loan error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};