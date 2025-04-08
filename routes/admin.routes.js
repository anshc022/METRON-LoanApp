const express = require("express");
const router = express.Router();
const {
  createAgent,
  getAllAgents,
  getAgentById,
  updateAgentById,
  deleteAgentById,
} = require("../controllers/admin.controller");

const {
  createShop,
  getShopById,
  getAllShops,
  updateShopById,
  deleteShopById
} = require("../controllers/shop.controller");

const { verifyToken } = require("../middleware/auth.middleware");
const { isAdmin } = require("../middleware/role.middleware");

//agents management
router.post("/create-agent", verifyToken, isAdmin, createAgent);
router.get("/agents", verifyToken, isAdmin, getAllAgents);
router.get("/agent/:id", verifyToken, isAdmin, getAgentById);
router.put("/agent/:id", verifyToken, isAdmin, updateAgentById);
router.delete("/agent/:id", verifyToken, isAdmin, deleteAgentById);

//shop management
router.post("/create-shop", verifyToken, isAdmin, createShop);
router.get("/shops", verifyToken, isAdmin, getAllShops);
router.get("/shop/:id", verifyToken, isAdmin, getShopById);
router.put("/shop/:id",verifyToken, isAdmin, updateShopById);
router.delete("/shop/:id", verifyToken, isAdmin, deleteShopById);






module.exports = router;
