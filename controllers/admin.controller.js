const { User } = require("../models");
const bcrypt = require("bcryptjs");

// create Agent only admin can create
exports.createAgent = async (req, res) => {
  const { name, email, password, role, location } = req.body;

  try {
    // Check if the user is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can create agents" });
    }

    // Check if the agent already exists
    const existingAgent = await User.findOne({ where: { email } });
    if (existingAgent) {
      return res.status(400).json({ message: "Agent already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the agent
    const agent = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      location,
    });

    res.status(201).json({
      message: "Agent created successfully",
      agent: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        location: agent.location,
      },
    });
  } catch (error) {
    console.error("Create agent error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// get all agents
exports.getAllAgents = async (req, res) => {
  try {
    const agents = await User.findAll({
      where: { role: "agent" },
      attributes: ["id", "name", "email", "location", "created_at"],
    });

    res.status(200).json({ success: true, data: agents });
  } catch (err) {
    console.error("Error fetching agents:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// get agent by id
exports.getAgentById = async (req, res) => {
  const { id } = req.params;

  try {
    const agent = await User.findOne({
      where: { id, role: "agent" },
      attributes: ["id", "name", "email", "location", "created_at"],
    });

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    res.status(200).json({ success: true, data: agent });
  } catch (error) {
    console.error("Error fetching agent by ID:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// update agent by id
exports.updateAgentById = async (req, res) => {
    const agentId = req.params.id;
    const { name, email, location } = req.body;
  
    try {
      // Find the agent
      const agent = await User.findOne({
        where: {
          id: agentId,
          role: 'agent'
        }
      });
  
      if (!agent) {
        return res.status(404).json({ success: false, message: 'Agent not found' });
      }
  
      // Update fields
      agent.name = name || agent.name;
      agent.email = email || agent.email;
      agent.location = location || agent.location;
  
      await agent.save();
  
      res.status(200).json({
        success: true,
        message: 'Agent updated successfully',
        data: {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          location: agent.location
        }
      });
  
    } catch (err) {
      console.error('Error updating agent:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };

  // delete agent by id
exports.deleteAgentById = async (req, res) => {
    const agentId = req.params.id;
  
    try {
      // Find the agent
      const agent = await User.findOne({
        where: {
          id: agentId,
          role: 'agent'
        }
      });
  
      if (!agent) {
        return res.status(404).json({ success: false, message: 'Agent not found' });
      }
  
      // Delete the agent
      await agent.destroy();
  
      res.status(200).json({
        success: true,
        message: 'Agent deleted successfully'
      });
  
    } catch (err) {
      console.error('Error deleting agent:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };