const { Collection, Loan, Shop, User } = require('../models');
const { Op } = require("sequelize");
exports.createCollection = async (req, res) => {
  try {
    const { loan_id, amount_collected, payment_mode, collection_date } = req.body;
    const user = req.user;

    // Validate input
    if (!loan_id || !amount_collected || !payment_mode || !collection_date) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if the loan exists and include its shop to verify ownership
    const loan = await Loan.findByPk(loan_id, {
      include: { model: Shop }
    });

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    //if amount collected is greater than loan amount and less than 0 then show failed
    if (amount_collected > loan.amount || amount_collected < 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount collected' });
    }

    const shop = loan.Shop;

    // Agent restriction: can only collect if they own the shop
    if (user.role === 'agent') {
      if (shop.agent_id !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'You are not allowed to collect for this shop.'
        });
      }
    }

    const collection = await Collection.create({
      collection_date,
      amount_collected,
      payment_mode,
      loan_id,
      collected_by: user.id
    });

    res.status(201).json({
      success: true,
      message: 'Collection submitted successfully',
      collection
    });

  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
            attributes: ['id', 'name', 'location', 'agent_id']
          }
        },
        {
          model: User,
          attributes: ['id', 'name', 'email'],
          as: 'User' 
        }
      ]
    });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    const shop = collection.Loan.Shop;

    // Agent can only view if they collected it or it's their shop
    if (
      user.role === 'agent' &&
      collection.collected_by !== user.id &&
      shop.agent_id !== user.id
    ) {
      return res.status(403).json({ message: "Not authorized to view this collection" });
    }

    res.status(200).json({
      success: true,
      collection
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
            attributes: ['id', 'name', 'location', 'agent_id']
          }
        },
        {
          model: User,
          attributes: ['id', 'name', 'email'],
          as: 'User'
        }
      ];
  
      if (user.role === 'agent') {
        // Get collections:
        // 1. Collected by the agent OR
        // 2. Shop's agent_id matches agent
        whereClause = {
          [Op.or]: [
            { collected_by: user.id },
            {
              '$Loan.Shop.agent_id$': user.id
            }
          ]
        };
      }
  
      const collections = await Collection.findAll({
        where: whereClause,
        include,
        order: [['collection_date', 'DESC']]
      });
  
      res.status(200).json({
        success: true,
        count:collections.length,
        collections
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
            attributes: ['id', 'name', 'agent_id']
          }
        }
      });
  
      if (!collection) {
        return res.status(404).json({ success: false, message: "Collection not found" });
      }
  
      if (user.role === 'agent') {
        const shopAgentId = collection.Loan.Shop.agent_id;
        if (collection.collected_by !== user.id && shopAgentId !== user.id) {
          return res.status(403).json({ success: false, message: "Not authorized to update this collection" });
        }
      }
  
      // Update allowed fields
      collection.amount_collected = amount_collected ?? collection.amount_collected;
      collection.payment_mode = payment_mode ?? collection.payment_mode;
      collection.collection_date = collection_date ?? collection.collection_date;
  
      await collection.save();
  
      res.status(200).json({
        success: true,
        message: "Collection updated successfully",
        collection
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
            attributes: ['id', 'name', 'agent_id']
          }
        }
      });
  
      if (!collection) {
        return res.status(404).json({ success: false, message: "Collection not found" });
      }
  
      if (user.role === 'agent') {
        const shopAgentId = collection.Loan.Shop.agent_id;
        if (collection.collected_by !== user.id && shopAgentId !== user.id) {
          return res.status(403).json({ success: false, message: "Not authorized to delete this collection" });
        }
      }
  
      await collection.destroy();
  
      res.status(200).json({
        success: true,
        message: "Collection deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting collection:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };

  // get all collection by loan id
//   exports.getCollectionsByLoanId = async (req, res) => {
//     try {
//       const { loanId } = req.params;
//       const user = req.user;
  
//       // Fetch loan with shop info
//       const loan = await Loan.findByPk(loanId, {
//         // include: {
//         //   model: Shop,
//         //   attributes: ['id', 'name', 'location', 'agent_id']
//         // }
//       });
  
//       if (!loan) {
//         return res.status(404).json({ message: 'Loan not found' });
//       }
  
//       // Check access for agents
//       if (user.role === 'agent' && loan.Shop.agent_id !== user.id) {
//         return res.status(403).json({ message: 'Unauthorized access to this loan' });
//       }
  
//       const collections = await Collection.findAll({
//         where: { loan_id: loanId },
//         include: {
//           model: User,
//           attributes: ['id', 'name', 'email'],
//           as: 'User'
//         },
//         order: [['collection_date', 'DESC']]
//       });
  
//       res.status(200).json({ 
//         loan: loan.id,
//         shop: loan.Shop,
//         collection_count :collections.length, 
//         collections });
//     } catch (error) {
//       console.error('Error fetching collections by loan ID:', error);
//       res.status(500).json({ message: 'Server error' });
//     }
//   };