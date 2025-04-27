const express = require("express");
const router = express.Router();
const {
  createShop,
  getShopById,
  getAllShops,
  updateShopById,
} = require("../controllers/shop.controller");

const {
  createLoan,
  updateLoanById,
  getLoanById,
  getAllLoans,
} = require("../controllers/loan.controller");

const { verifyToken } = require("../middleware/auth.middleware");
const { isAgent } = require("../middleware/role.middleware");
const {
   createCollection, 
   getCollectionById, 
   getAllCollections, 
   updateCollectionById, 
   deleteCollectionById, 
   getCollectionsByLoanId, 
   getCollectionsByShopId 
} = require("../controllers/collection.controller");

const { createReschedule, getAllReschedules } = require("../controllers/reschedule.controller");
const { getDashboardStats, getTodayCollections } = require("../controllers/agent.controller");

// Dashboard routes
router.get("/dashboard/stats", verifyToken, getDashboardStats);
router.get("/dashboard/today-collections", verifyToken, getTodayCollections);

//shop management
router.post("/create-shop", verifyToken, isAgent, createShop);
router.get("/shop/:id", verifyToken, isAgent, getShopById);
router.get("/shops", verifyToken, isAgent, getAllShops);
router.put("/shop/:id", verifyToken, isAgent, updateShopById);

//get all collection of shop by id
router.get("/shop/:id/collections", verifyToken, isAgent, getCollectionsByShopId);

//loan management
router.post("/create-loan", verifyToken, isAgent, createLoan);
router.put("/loan/:id", verifyToken, isAgent, updateLoanById);
router.get("/loan/:id", verifyToken, isAgent, getLoanById);
router.get("/loans", verifyToken, isAgent, getAllLoans);

// get collcections of a loan
router.get("/loan/:id/collections",verifyToken,isAgent,getCollectionsByLoanId);

//Collection management
router.post("/create-collection", verifyToken, isAgent, createCollection);
router.get("/collection/:id", verifyToken, isAgent, getCollectionById);
router.get("/collections", verifyToken, isAgent, getAllCollections);
router.put("/collection/:id", verifyToken, isAgent, updateCollectionById);
router.delete("/collection/:id", verifyToken, isAgent, deleteCollectionById);

//reschedule loan apies
router.post("/create-reschedule", verifyToken, isAgent, createReschedule);
router.get("/reschedules", verifyToken, isAgent, getAllReschedules);

module.exports = router;
