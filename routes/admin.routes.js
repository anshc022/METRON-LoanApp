const express = require("express");
const router = express.Router();
const {
  createAgent,
  getAllAgents,
  getAgentById,
  updateAgentById,
  deleteAgentById
} = require("../controllers/admin.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { isAdmin } = require("../middleware/role.middleware");

router.post("/create-agent", verifyToken, isAdmin, createAgent);
router.get("/agents", verifyToken, isAdmin, getAllAgents);
router.get("/agent/:id", verifyToken, isAdmin, getAgentById);
router.put("/agent/:id", verifyToken, isAdmin, updateAgentById);
router.delete("/agent/:id", verifyToken, isAdmin, deleteAgentById);

module.exports = router;
