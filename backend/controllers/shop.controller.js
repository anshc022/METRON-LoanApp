const { Shop, User } = require("../models");


//create shop
exports.createShop = async (req, res) => {
  try {
    const { name, owner_name, location, agent_id: passedAgentId } = req.body;
    const user = req.user;

    if (!name || !location) {
      return res
        .status(400)
        .json({ message: "Name and location are required" });
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
        const agent = await User.findByPk(passedAgentId);
        if (!agent || agent.role !== "agent") {
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

    // Fetch the shop again with agent details

    // Fetch the shop again with agent details (name, email)
    const shopWithAgent = await Shop.findByPk(newShop.id, {
      include: {
        model: User,
        attributes: ["id", "name", "email"],
        as: "User",
      },
    });

    res.status(201).json({
      success: true,
      message: "Shop created successfully",
      shop: shopWithAgent,
    });
  } catch (error) {
    console.error("Error creating shop:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// get shop details by id 
exports.getShopById = async (req, res) => {
    try {
      const shopId = req.params.id;
      const user = req.user;


      const shop = await Shop.findByPk(shopId, {
        attributes: ['id', 'name', 'owner_name', 'location', 'agent_id'],
        include: {
          model: User,
          attributes: ['id', 'name', 'email'],
          as: 'User' // this is correct because you didn’t use alias in your model setup
        }
      });
  
      if (!shop) {
        return res.status(404).json({
          success: false,
          message: 'Shop not found',
        });
      }
      
      //  If agent, only allow access to shops assigned to them
        if (user.role === 'agent' && shop.agent_id !== user.id) {
            return res.status(403).json({
            success: false,
            message: 'Unauthorized access. You can only view shops assigned to you.',
        });
      }


      res.status(200).json({
        success: true,
        shop,
      });
    } catch (error) {
      console.error("Error fetching shop:", error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  
  // get all shops
  exports.getAllShops = async (req, res) => {
    try {
      const user = req.user;
      let shops;

      if (user.role === 'admin') {
        shops = await Shop.findAll({
          include: {
            model: User,
            attributes: ['id', 'name', 'email'],
            as: 'User'
          }
        });
      } else if (user.role === 'agent') {
        shops = await Shop.findAll({
          where: { agent_id: user.id },
          include: {
            model: User,
            attributes: ['id', 'name', 'email'],
            as: 'User'
          }
        });
      }

      res.status(200).json({
        success: true,
        count : shops.length,
        shops,
      });
    } catch (error) {
      console.error("Error fetching shops:", error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

// update shop details by id
exports.updateShopById = async (req, res) => {
    try {
      const shopId = req.params.id;
      const user = req.user;
      const { name, owner_name, location } = req.body;

      // Check if the shop exists
      const shop = await Shop.findByPk(shopId);
      if (!shop) {
        return res.status(404).json({ 
            success:false,
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

      // Update the shop details
      await shop.update({
        name,
        owner_name,
        location,
      });

      res.status(200).json({
        success: true,
        message: "Shop updated successfully",
        shop,
      });
    } catch (error) {
      console.error("Error updating shop:", error);
      res.status(500).json({ message: "Server error" });
    }
  };


  // delete shop by id - only admin can do 
exports.deleteShopById = async (req,res) => {
    try {
        const shopId = req.params.id;
        const user = req.user;

        // Check if the shop exists
        const shop = await Shop.findByPk(shopId);
        if (!shop) {
            return res.status(404).json({ 
                success:false,
                message: "Shop not found" 
            });
          }

        // If agent, restrict them to delete shops
        if (user.role === "agent") {
            return res.status(403).json({
              success: false,
              message: "Unauthorized access. You can not delete shops.",
            });
          }

        await shop.destroy();

        res.status(200).json({
            success: true,
            message: "Shop deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting shop:", error);
        res.status(500).json({ message: "Server error" });
    }
}