const { User } = require("../models");
const bcrypt = require("bcryptjs");
const { Op } = require('sequelize');
const { Collection, Loan, Shop } = require('../models');

exports.createAgent = async (req, res) => {
  try {
    const { name, email, password, location } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const agent = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "agent",
      location
    });

    res.status(201).json({
      success: true,
      message: "Agent created successfully",
      data: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        role: agent.role,
        location: agent.location,
        created_at: agent.created_at
      }
    });
  } catch (error) {
    console.error("Create agent error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.getAllAgents = async (req, res) => {
  try {
    const agents = await User.findAll({
      where: { role: "agent" },
      attributes: ["id", "name", "email", "location", "created_at"],
    });

    res.status(200).json({
      success: true,
      data: agents
    });
  } catch (err) {
    console.error("Error fetching agents:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.getAgentById = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await User.findOne({
      where: { id, role: "agent" },
      attributes: ["id", "name", "email", "location", "created_at"],
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found"
      });
    }

    res.status(200).json({
      success: true,
      data: agent
    });
  } catch (err) {
    console.error("Error fetching agent by ID:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.updateAgentById = async (req, res) => {
  try {
    const agentId = req.params.id;
    const { name, email, location } = req.body;

    // Find the agent
    const agent = await User.findOne({
      where: {
        id: agentId,
        role: 'agent'
      }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Check if email is being changed and already exists
    if (email && email !== agent.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Update fields if provided
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (location) updates.location = location;

    await agent.update(updates);

    res.status(200).json({
      success: true,
      message: 'Agent updated successfully',
      data: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        role: agent.role,
        location: agent.location,
        created_at: agent.created_at
      }
    });
  } catch (err) {
    console.error('Error updating agent:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.deleteAgentById = async (req, res) => {
  try {
    const agentId = req.params.id;

    const agent = await User.findOne({
      where: {
        id: agentId,
        role: 'agent'
      }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    await agent.destroy();

    res.status(200).json({
      success: true,
      message: 'Agent deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting agent:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getReports = async (req, res) => {
  try {
    // Example reports data (replace with actual database query if needed)
    const reports = [
      {
        name: 'Monthly Loan Report',
        date: '2025-04-01',
        url: '/reports/monthly-loan-report.pdf',
      },
      {
        name: 'Agent Performance Report',
        date: '2025-04-15',
        url: '/reports/agent-performance-report.pdf',
      },
    ];

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
    });
  }
};

exports.getDailyReport = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const collections = await Collection.findAll({
      where: {
        collection_date: {
          [Op.gte]: today,
        },
      },
      include: [
        {
          model: Loan,
          include: [
            { model: Shop }
          ]
        },
        {
          model: User,
          as: 'User'
        }
      ]
    });

    // Format collections into reports
    const reports = collections.map(collection => ({
      name: `Collection Report - ${collection.Loan?.Shop?.name || 'Unknown Shop'}`,
      date: collection.collection_date,
      url: `#/collection/${collection.id}`,
      amount: collection.amount_collected,
      shopName: collection.Loan?.Shop?.name,
      agentName: collection.User?.name
    }));

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('Error fetching daily report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily report',
    });
  }
};

exports.getWeeklyReport = async (req, res) => {
  try {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    const collections = await Collection.findAll({
      where: {
        collection_date: {
          [Op.between]: [lastWeek, today],
        },
      },
      include: [
        {
          model: Loan,
          include: [
            { model: Shop }
          ]
        },
        {
          model: User,
          as: 'User'
        }
      ]
    });

    // Format collections into reports
    const reports = collections.map(collection => ({
      name: `Collection Report - ${collection.Loan?.Shop?.name || 'Unknown Shop'}`,
      date: collection.collection_date,
      url: `#/collection/${collection.id}`,
      amount: collection.amount_collected,
      shopName: collection.Loan?.Shop?.name,
      agentName: collection.User?.name
    }));

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('Error fetching weekly report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly report',
    });
  }
};

exports.getCustomReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }

    const collections = await Collection.findAll({
      where: {
        collection_date: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
      },
      include: [
        {
          model: Loan,
          include: [
            { model: Shop }
          ]
        },
        {
          model: User,
          as: 'User'
        }
      ]
    });

    // Format collections into reports
    const reports = collections.map(collection => ({
      name: `Collection Report - ${collection.Loan?.Shop?.name || 'Unknown Shop'}`,
      date: collection.collection_date,
      url: `#/collection/${collection.id}`,
      amount: collection.amount_collected,
      shopName: collection.Loan?.Shop?.name,
      agentName: collection.User?.name
    }));

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('Error fetching custom report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch custom report',
    });
  }
};