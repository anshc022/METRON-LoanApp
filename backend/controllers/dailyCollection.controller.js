// controllers/dailyCollection.controller.js
const { Collection } = require('../models');
const { Op } = require('sequelize');

// Create a new daily collection
exports.createDailyCollection = async (req, res) => {
  try {
    const { date, collections } = req.body;
    
    if (!date || !collections || !Array.isArray(collections)) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing or invalid format"
      });
    }

    // For now, we'll store daily collection as regular collections with a note
    // In the future, you may want to create a separate model for daily collections
    const createdCollections = await Promise.all(
      collections.map(async (item) => {
        const collection = await Collection.create({
          collection_date: date,
          amount_collected: item.amount,
          payment_mode: item.payment_mode || 'cash',
          loan_id: item.loan_id,
          collected_by: req.user.id
        });
        
        return collection;
      })
    );

    return res.status(201).json({
      success: true,
      message: "Daily collections created successfully",
      data: createdCollections
    });
  } catch (error) {
    console.error("Error creating daily collection:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get daily collection by ID
exports.getDailyCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const date = id; // Assuming ID is the date in YYYY-MM-DD format
    
    // Fetch all collections for the specified date
    const collections = await Collection.findAll({
      where: {
        collection_date: date
      }
    });

    if (!collections || collections.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No collections found for the specified date"
      });
    }

    return res.status(200).json({
      success: true,
      data: collections
    });
  } catch (error) {
    console.error("Error fetching daily collection:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get all daily collections (grouped by date)
exports.getAllDailyCollections = async (req, res) => {
  try {
    // Find all collections
    const collections = await Collection.findAll();
    
    // Group collections by date
    const groupedByDate = collections.reduce((acc, collection) => {
      const date = collection.collection_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(collection);
      return acc;
    }, {});

    const dailyCollections = Object.keys(groupedByDate).map(date => ({
      date,
      collections: groupedByDate[date],
      totalAmount: groupedByDate[date].reduce((sum, col) => sum + Number(col.amount_collected), 0)
    }));

    return res.status(200).json({
      success: true,
      data: dailyCollections
    });
  } catch (error) {
    console.error("Error fetching all daily collections:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Update daily collection by ID
exports.updateDailyCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, collections } = req.body;
    
    // For this implementation, we'll assume the ID is a date
    // and we're updating all collections for that date
    if (!date || !collections || !Array.isArray(collections)) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing or invalid format"
      });
    }

    // First, find all collections for the date
    const existingCollections = await Collection.findAll({
      where: {
        collection_date: id
      }
    });

    if (!existingCollections || existingCollections.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No collections found for the specified date"
      });
    }

    // For simplicity, we'll delete all existing collections for that date
    // and create new ones - in a real app, you might want to update them more intelligently
    await Collection.destroy({
      where: {
        collection_date: id
      }
    });

    // Create new collections
    const updatedCollections = await Promise.all(
      collections.map(async (item) => {
        const collection = await Collection.create({
          collection_date: date,
          amount_collected: item.amount,
          payment_mode: item.payment_mode || 'cash',
          loan_id: item.loan_id,
          collected_by: req.user.id
        });
        
        return collection;
      })
    );

    return res.status(200).json({
      success: true,
      message: "Daily collections updated successfully",
      data: updatedCollections
    });
  } catch (error) {
    console.error("Error updating daily collection:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Delete daily collection by ID
exports.deleteDailyCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Assuming ID is a date in YYYY-MM-DD format
    const result = await Collection.destroy({
      where: {
        collection_date: id
      }
    });

    if (result === 0) {
      return res.status(404).json({
        success: false,
        message: "No collections found for the specified date"
      });
    }

    return res.status(200).json({
      success: true,
      message: "All collections for the specified date deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting daily collection:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};