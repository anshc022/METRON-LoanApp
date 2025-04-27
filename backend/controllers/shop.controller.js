const { Shop, User } = require("../models");

//create shop
exports.createShop = async (req, res) => {
  try {
    const { name, owner_name, location, agent_id: passedAgentId } = req.body;
    const user = req.user;

    if (!name || !location) {
      return res.status(400).json({
        success: false,
        message: "Name and location are required"
      });
    }

    let agent_id = null;

    if (user.role === "agent") {
      // Agent can only create shop in their own location
      if (user.location !== location) {
        return res.status(403).json({
          success: false,
          message: "Agents can only create shops in their assigned location",
        });
      }
      agent_id = user.id;
    } else if (user.role === "admin") {
      // If admin passed agent_id, validate it
      if (passedAgentId) {
        const agent = await User.findOne({
          where: { id: passedAgentId, role: 'agent' }
        });
        
        if (!agent) {
          return res.status(400).json({
            success: false,
            message: "Invalid agent_id. Must be a valid agent user.",
          });
        }
        agent_id = passedAgentId;
      }
    }

    const newShop = await Shop.create({
      name,
      owner_name,
      location,
      agent_id,
    });

    // Fetch the shop with agent details
    const shopWithAgent = await Shop.findByPk(newShop.id, {
      include: {
        model: User,
        attributes: ["id", "name", "email", "location"],
        as: "User"
      }
    });

    res.status(201).json({
      success: true,
      message: "Shop created successfully",
      data: {
        id: shopWithAgent.id,
        name: shopWithAgent.name,
        owner_name: shopWithAgent.owner_name,
        location: shopWithAgent.location,
        agent_id: shopWithAgent.agent_id,
        agent: shopWithAgent.User ? {
          id: shopWithAgent.User.id,
          name: shopWithAgent.User.name,
          email: shopWithAgent.User.email,
          location: shopWithAgent.User.location
        } : null
      }
    });
  } catch (error) {
    console.error("Error creating shop:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

// get shop details by id 
exports.getShopById = async (req, res) => {
  try {
    const shopId = req.params.id;
    const user = req.user;

    const shop = await Shop.findByPk(shopId, {
      include: {
        model: User,
        attributes: ['id', 'name', 'email', 'location'],
        as: 'User'
      }
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }
    
    // If agent, only allow access to shops assigned to them
    if (user.role === 'agent' && shop.agent_id !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access. You can only view shops assigned to you.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: shop.id,
        name: shop.name,
        owner_name: shop.owner_name,
        location: shop.location,
        agent_id: shop.agent_id,
        agent: shop.User ? {
          id: shop.User.id,
          name: shop.User.name,
          email: shop.User.email,
          location: shop.User.location
        } : null
      }
    });
  } catch (error) {
    console.error("Error fetching shop:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// get all shops
exports.getAllShops = async (req, res) => {
  try {
    const user = req.user;
    let shops;

    const queryOptions = {
      include: {
        model: User,
        attributes: ['id', 'name', 'email', 'location'],
        as: 'User'
      }
    };

    if (user.role === 'agent') {
      queryOptions.where = { agent_id: user.id };
    }

    shops = await Shop.findAll(queryOptions);

    const formattedShops = shops.map(shop => ({
      id: shop.id,
      name: shop.name,
      owner_name: shop.owner_name,
      location: shop.location,
      agent_id: shop.agent_id,
      agent_name: shop.User ? shop.User.name : 'Unassigned', // Include agent_name
      agent: shop.User ? {
        id: shop.User.id,
        name: shop.User.name,
        email: shop.User.email,
        location: shop.User.location
      } : null
    }));

    res.status(200).json({
      success: true,
      data: formattedShops
    });
  } catch (error) {
    console.error("Error fetching shops:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// update shop details by id
exports.updateShopById = async (req, res) => {
  try {
    const shopId = req.params.id;
    const user = req.user;
    const { name, owner_name, location, agent_id: newAgentId } = req.body;

    const shop = await Shop.findByPk(shopId, {
      include: {
        model: User,
        attributes: ['id', 'name', 'email', 'location'],
        as: 'User'
      }
    });

    if (!shop) {
      return res.status(404).json({ 
        success: false,
        message: "Shop not found" 
      });
    }

    // If agent, only allow them to update their own shops
    if (user.role === "agent" && shop.agent_id !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access. You can only update your own shops.",
      });
    }

    // If admin, validate the new agent_id if provided
    if (user.role === "admin" && newAgentId) {
      const agent = await User.findOne({
        where: { id: newAgentId, role: 'agent' }
      });

      if (!agent) {
        return res.status(400).json({
          success: false,
          message: "Invalid agent_id. Must be a valid agent user.",
        });
      }

      shop.agent_id = newAgentId; // Update the agent_id
    }

    // Update the shop details
    await shop.update({
      name: name || shop.name,
      owner_name: owner_name || shop.owner_name,
      location: location || shop.location,
      agent_id: shop.agent_id, // Ensure agent_id is updated
    });

    // Fetch updated shop with agent details
    const updatedShop = await Shop.findByPk(shopId, {
      include: {
        model: User,
        attributes: ['id', 'name', 'email', 'location'],
        as: 'User'
      }
    });

    res.status(200).json({
      success: true,
      message: "Shop updated successfully",
      data: {
        id: updatedShop.id,
        name: updatedShop.name,
        owner_name: updatedShop.owner_name,
        location: updatedShop.location,
        agent_id: updatedShop.agent_id,
        agent: updatedShop.User ? {
          id: updatedShop.User.id,
          name: updatedShop.User.name,
          email: updatedShop.User.email,
          location: updatedShop.User.location
        } : null
      }
    });
  } catch (error) {
    console.error("Error updating shop:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

// delete shop by id - only admin can do 
exports.deleteShopById = async (req, res) => {
  try {
    const shopId = req.params.id;
    const user = req.user;

    const shop = await Shop.findByPk(shopId);
    if (!shop) {
      return res.status(404).json({ 
        success: false,
        message: "Shop not found" 
      });
    }

    // If agent, restrict them to delete shops
    if (user.role === "agent") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access. Only admins can delete shops.",
      });
    }

    await shop.destroy();

    res.status(200).json({
      success: true,
      message: "Shop deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting shop:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};