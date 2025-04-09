const { Collection, Loan, Shop, User } = require("../models");
const { Op } = require("sequelize");
exports.createCollection = async (req, res) => {
  try {
    const { loan_id, amount_collected, payment_mode, collection_date } =
      req.body;
    const user = req.user;

    // Validate input
    if (!loan_id || !amount_collected || !payment_mode || !collection_date) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // Check if the loan exists and include its shop to verify ownership
    const loan = await Loan.findByPk(loan_id, {
      include: { model: Shop },
    });

    if (!loan) {
      return res
        .status(404)
        .json({ success: false, message: "Loan not found" });
    }

    //if amount collected is greater than loan amount and less than 0 then show failed
    if (amount_collected > loan.amount || amount_collected < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount collected" });
    }

    const shop = loan.Shop;

    // Agent restriction: can only collect if they own the shop
    if (user.role === "agent") {
      if (shop.agent_id !== user.id) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to collect for this shop.",
        });
      }
    }

    const collection = await Collection.create({
      collection_date,
      amount_collected,
      payment_mode,
      loan_id,
      collected_by: user.id,
    });

    res.status(201).json({
      success: true,
      message: "Collection submitted successfully",
      collection,
    });
  } catch (error) {
    console.error("Error creating collection:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//get collection by id
exports.getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const collection = await Collection.findByPk(id, {
      include: [
        {
          model: Loan,
          include: {
            model: Shop,
            attributes: ["id", "name", "location", "agent_id"],
          },
        },
        {
          model: User,
          attributes: ["id", "name", "email"],
          as: "User",
        },
      ],
    });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    const shop = collection.Loan.Shop;

    // Agent can only view if they collected it or it's their shop
    if (
      user.role === "agent" &&
      collection.collected_by !== user.id &&
      shop.agent_id !== user.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this collection" });
    }

    res.status(200).json({
      success: true,
      collection,
    });
  } catch (error) {
    console.error("Error fetching collection:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//get all collections
exports.getAllCollections = async (req, res) => {
  try {
    const user = req.user;

    let whereClause = {};
    let include = [
      {
        model: Loan,
        include: {
          model: Shop,
          attributes: ["id", "name", "location", "agent_id"],
        },
      },
      {
        model: User,
        attributes: ["id", "name", "email"],
        as: "User",
      },
    ];

    if (user.role === "agent") {
      // Get collections:
      // 1. Collected by the agent OR
      // 2. Shop's agent_id matches agent
      whereClause = {
        [Op.or]: [
          { collected_by: user.id },
          {
            "$Loan.Shop.agent_id$": user.id,
          },
        ],
      };
    }

    const collections = await Collection.findAll({
      where: whereClause,
      include,
      order: [["collection_date", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: collections.length,
      collections,
    });
  } catch (error) {
    console.error("Error fetching collections:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//update collection by id
exports.updateCollectionById = async (req, res) => {
  try {
    const collectionId = req.params.id;
    const user = req.user;
    const { amount_collected, payment_mode, collection_date } = req.body;

    const collection = await Collection.findByPk(collectionId, {
      include: {
        model: Loan,
        include: {
          model: Shop,
          attributes: ["id", "name", "agent_id"],
        },
      },
    });

    if (!collection) {
      return res
        .status(404)
        .json({ success: false, message: "Collection not found" });
    }

    if (user.role === "agent") {
      const shopAgentId = collection.Loan.Shop.agent_id;
      if (collection.collected_by !== user.id && shopAgentId !== user.id) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Not authorized to update this collection",
          });
      }
    }

    // Update allowed fields
    collection.amount_collected =
      amount_collected ?? collection.amount_collected;
    collection.payment_mode = payment_mode ?? collection.payment_mode;
    collection.collection_date = collection_date ?? collection.collection_date;

    await collection.save();

    res.status(200).json({
      success: true,
      message: "Collection updated successfully",
      collection,
    });
  } catch (error) {
    console.error("Error updating collection:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//delete collection by id
exports.deleteCollectionById = async (req, res) => {
  try {
    const collectionId = req.params.id;
    const user = req.user;

    const collection = await Collection.findByPk(collectionId, {
      include: {
        model: Loan,
        include: {
          model: Shop,
          attributes: ["id", "name", "agent_id"],
        },
      },
    });

    if (!collection) {
      return res
        .status(404)
        .json({ success: false, message: "Collection not found" });
    }

    if (user.role === "agent") {
      const shopAgentId = collection.Loan.Shop.agent_id;
      if (collection.collected_by !== user.id && shopAgentId !== user.id) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Not authorized to delete this collection",
          });
      }
    }

    await collection.destroy();

    res.status(200).json({
      success: true,
      message: "Collection deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting collection:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all collections by loan ID
exports.getCollectionsByLoanId = async (req, res) => {
  try {
    const loanId = req.params.id;

    const user = req.user;
    console.log("Loan ID from params:", req.params.loanId);

    // Validate loanId
    const parsedLoanId = parseInt(loanId);
    if (isNaN(parsedLoanId)) {
      return res.status(400).json({ message: "Invalid loan ID" });
    }

    // Fetch loan by ID
    const loan = await Loan.findByPk(parsedLoanId);
    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // Fetch related shop
    const shop = await Shop.findByPk(loan.shop_id);
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // Role check for agents
    if (user.role === "agent" && shop.agent_id !== user.id) {
      return res
        .status(403)
        .json({ message: "Unauthorized access to this loan" });
    }

    // Get collections
    const collections = await Collection.findAll({
      where: { loan_id: parsedLoanId },
      include: {
        model: User,
        attributes: ["id", "name", "email"],
      },
      order: [["collection_date", "DESC"]],
    });

    return res.status(200).json({
      loan: loan,
      shop: shop,
      collection_count: collections.length,
      collections,
    });
  } catch (error) {
    console.error("Error fetching collections by loan ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// get all collecion of agent (only admin can access)

exports.getCollectionsByAgentId = async (req, res) => {
  try {
    const { id } = req.params; // agent ID
    const user = req.user;

    if (!id) {
      return res
        .status(400)
        .json({ message: "Agent ID is required in params" });
    }

    //only admin can access
    if (user.role != "admin") {
      return res
        .status(403)
        .json({
          message: "Unauthorise Access!, Only admin can access this route",
        });
    }

    const collections = await Collection.findAll({
      where: { collected_by: id },
      include: [
        {
          model: Loan,
          include: {
            model: Shop,
            attributes: ["id", "name", "location", "agent_id"],
          },
        },
      ],
      order: [["collection_date", "DESC"]],
    });

    const response = collections.map((col) => ({
      collection: {
        id: col.id,
        collection_date: col.collection_date,
        amount_collected: col.amount_collected,
        payment_mode: col.payment_mode,
        loan_id: col.loan_id,
      },
      shop: col.Loan?.Shop || null,
    }));

    res.status(200).json({
      success: true,
      count: response.length,
      data: response,
    });
  } catch (error) {
    console.error("Error fetching collections by agent:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// get all collection of a shop by shop id
exports.getCollectionsByShopId = async (req, res) => {
  try {
    const shopId = req.params.id;
    const user = req.user;

    const shop = await Shop.findByPk(shopId);

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Restrict agent access to only their own shop
    if (user.role === 'agent' && shop.agent_id !== user.id) {
      return res.status(403).json({ message: 'Unauthorized to view this shop\'s collections' });
    }

  
    // Get all loan IDs for the shop
    const loans = await Loan.findAll({
      where: { shop_id: shopId },
      attributes: ['id']
    });

    const loanIds = loans.map(loan => loan.id);

    // Fetch collections and include collector (User)
    const collections = await Collection.findAll({
      where: { loan_id: loanIds },
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }],
      order: [['collection_date', 'DESC']]
    });

    // Format the response
    const formattedCollections = collections.map(col => ({
      id: col.id,
      collection_date: col.collection_date,
      amount_collected: col.amount_collected,
      payment_mode: col.payment_mode,
      loan_id: col.loan_id,
      collected_by: {
        id: col.User?.id,
        name: col.User?.name,
        email: col.User?.email
      }
    }));

    res.status(200).json({
      success: true,
      shop: {
        id: shop.id,
        name: shop.name,
        location: shop.location,
        owner_name: shop.owner_name,
      },
      collection_count: formattedCollections.length,
      collections: formattedCollections
    });

  } catch (error) {
    console.error('Error fetching shop collections:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

