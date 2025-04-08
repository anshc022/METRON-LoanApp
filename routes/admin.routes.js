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
  deleteShopById,
} = require("../controllers/shop.controller");

const { verifyToken } = require("../middleware/auth.middleware");
const { isAdmin } = require("../middleware/role.middleware");
const {
  createLoan,
  updateLoanById,
  getLoanById,
  getAllLoans,
  deleteLoanById,
} = require("../controllers/loan.controller");
const {
  createCollection,
  getCollectionById,
  getAllCollections,
  updateCollectionById,
  deleteCollectionById,
  getCollectionsByLoanId,
} = require("../controllers/collection.controller");

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
router.put("/shop/:id", verifyToken, isAdmin, updateShopById);
router.delete("/shop/:id", verifyToken, isAdmin, deleteShopById);

//loan management
router.post("/create-loan", verifyToken, isAdmin, createLoan);
router.put("/loan/:id", verifyToken, isAdmin, updateLoanById);
router.get("/loan/:id", verifyToken, isAdmin, getLoanById);
router.get("/loans", verifyToken, isAdmin, getAllLoans);
router.delete("/loan/:id", verifyToken, isAdmin, deleteLoanById);

//collections management
router.post("/create-collection", verifyToken, isAdmin, createCollection);
router.get("/collection/:id", verifyToken, isAdmin, getCollectionById);
router.get("/collections", verifyToken, isAdmin, getAllCollections);
router.put("/collection/:id", verifyToken, isAdmin, updateCollectionById);
router.delete("/collection/:id", verifyToken, isAdmin, deleteCollectionById);

//advance collection apies
router.get("/collection/loan/:id",verifyToken,isAdmin,getCollectionsByLoanId);

module.exports = router;
