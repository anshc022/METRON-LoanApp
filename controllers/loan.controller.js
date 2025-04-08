const { User, Loan, Shop } = require("../models");
const bcrypt = require("bcryptjs");

//create loan to a shop amount,loan_date,due_date, shop id, created by
exports.createLoan = async (req, res) => {
  try {
    const { amount, loan_date, due_date, shop_id } = req.body;
    const user = req.user;

    // Basic validation
    if (!amount || !loan_date || !due_date || !shop_id) {
      return res.status(400).json({
        success: false,
        message: "Invalid input. Please provide all required fields.",
      });
    }

    // Find the shop
    const shop = await Shop.findByPk(shop_id);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    // Agent can only create loan for their assigned shop
    if (user.role === "agent" && shop.agent_id !== user.id) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorise Access, Agents can only create loans for their own shops",
      });
    }

    // Create the loan
    const newLoan = await Loan.create({
      amount,
      loan_date,
      due_date,
      shop_id,
      created_by: user.id, // Track who created the loan
    });

    res.status(201).json({
      success: true,
      message: "Loan created successfully",
      loan: newLoan,
    });
  } catch (error) {
    console.error("Error in creating loan for an shop:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//update a loan by id

exports.updateLoanById = async (req, res) => {
  try {
    const loanId = req.params.id;
    const user = req.user;
    const { amount, loan_date, due_date } = req.body;

    // Find the loan
    const loan = await Loan.findByPk(loanId);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    // Fetch the related shop
    const shop = await Shop.findByPk(loan.shop_id);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Associated shop not found",
      });
    }

    // If agent, check if shop belongs to them
    if (user.role === "agent" && shop.agent_id !== user.id) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorise Access!, Agents can only update loans for their own shops",
      });
    }

    // Update loan fields if provided
    if (amount !== undefined) loan.amount = amount;
    if (loan_date !== undefined) loan.loan_date = loan_date;
    if (due_date !== undefined) loan.due_date = due_date;

    await loan.save();

    res.status(200).json({
      success: true,
      message: "Loan updated successfully",
      loan,
    });
  } catch (error) {
    console.error("Error updating loan:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//get a loan by id
exports.getLoanById = async (req, res) => {
  try {
    const loanId = req.params.id;
    const user = req.user;

    const loan = await Loan.findByPk(loanId, {
      include: {
        model: Shop,
        include: {
          model: User,
          attributes: ["id", "name", "email"],
        },
      },
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    // If agent, ensure the shop belongs to them
    if (user.role === "agent" && loan.Shop.agent_id !== user.id) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can only view loans of your assigned shops.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Loan fetched successfully",
      loan: {
        id: loan.id,
        amount: loan.amount,
        loan_date: loan.loan_date,
        due_date: loan.due_date,
        shop: {
          id: loan.Shop.id,
          name: loan.Shop.name,
          location: loan.Shop.location,
        },
        agent: {
          id: loan.Shop.User.id,
          name: loan.Shop.User.name,
          email: loan.Shop.User.email,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching loan:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// get all loans
exports.getAllLoans = async (req, res) => {
  try {
    const user = req.user;

    let loanQuery = {
      include: {
        model: Shop,
        include: {
          model: User,
          attributes: ["id", "name", "email"],
        },
      },
      order: [["loan_date", "DESC"]],
    };

    // If agent, add filter to only get their shop loans
    if (user.role === "agent") {
      loanQuery.where = {};
      loanQuery.include.where = { agent_id: user.id };
    }

    const loans = await Loan.findAll(loanQuery);

    const formattedLoans = loans.map((loan) => ({
      id: loan.id,
      amount: loan.amount,
      loan_date: loan.loan_date,
      due_date: loan.due_date,
      shop: {
        id: loan.Shop.id,
        name: loan.Shop.name,
        location: loan.Shop.location,
      },
      agent: {
        id: loan.Shop.User.id,
        name: loan.Shop.User.name,
        email: loan.Shop.User.email,
      },
    }));

    res.status(200).json({
      success: true,
      message: "Loans fetched successfully",
      count:formattedLoans.length,
      loans: formattedLoans,

    });
  } catch (error) {
    console.error("Error fetching loans:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


//delete a loan by id
exports.deleteLoanById = async (req, res) => {
    try {
      const user = req.user;
  
      // Only admin can delete
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorise Access!, Agents cant delete loans.'
        });
      }
  
      const loanId = req.params.id;
  
      const loan = await Loan.findByPk(loanId);
      if (!loan) {
        return res.status(404).json({
          success: false,
          message: 'Loan not found'
        });
      }
  
      await loan.destroy();
  
      res.status(200).json({
        success: true,
        message: 'Loan deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting loan:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  };