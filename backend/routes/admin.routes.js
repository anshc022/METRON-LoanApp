const express = require("express");
const router = express.Router();
const {
  createAgent,
  getAllAgents,
  getAgentById,
  updateAgentById,
  deleteAgentById,
  getReports, // Import the getReports method
  getDailyReport,
  getWeeklyReport,
  getCustomReport,
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
  getCollectionsByAgentId,
  getCollectionsByShopId,
  getCollectionsByDateRange,
} = require("../controllers/collection.controller");
const { createReschedule, getAllReschedules } = require("../controllers/reschedule.controller");
const {
  createDailyCollection,
  getDailyCollectionById,
  getAllDailyCollections,
  updateDailyCollectionById,
  deleteDailyCollectionById
} = require("../controllers/dailyCollection.controller");
const { getDashboardStats, getTodayCollections } = require("../controllers/dashboard.controller");

// Dashboard routes
router.get("/dashboard/stats", verifyToken, getDashboardStats);
router.get("/dashboard/today-collections", verifyToken, getTodayCollections);

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
//get all collection of shop by id
router.get("/shop/:id/collections", verifyToken, isAdmin, getCollectionsByShopId);

//loan management
router.post("/create-loan", verifyToken, isAdmin, createLoan);
router.put("/loan/:id", verifyToken, isAdmin, updateLoanById);
router.get("/loan/:id", verifyToken, isAdmin, getLoanById);
router.get("/loans", verifyToken, isAdmin, getAllLoans);
router.delete("/loan/:id", verifyToken, isAdmin, deleteLoanById);

// get collections of a loan
router.get("/loan/:id/collections",verifyToken,isAdmin,getCollectionsByLoanId);

//collections management
router.post("/create-collection", verifyToken, isAdmin, createCollection);
router.get("/collection/:id", verifyToken, isAdmin, getCollectionById);
router.get("/collections", verifyToken, isAdmin, getAllCollections);
router.put("/collection/:id", verifyToken, isAdmin, updateCollectionById);
router.delete("/collection/:id", verifyToken, isAdmin, deleteCollectionById);

//advance collection apies
router.get('/collections/by-agent/:id',verifyToken,isAdmin,getCollectionsByAgentId);
router.get("/collections/by-date",verifyToken,isAdmin,getCollectionsByDateRange);

// Daily collections management
router.post("/create-daily-collection", verifyToken, isAdmin, createDailyCollection);
router.get("/daily-collection/:id", verifyToken, isAdmin, getDailyCollectionById);
router.get("/daily-collections", verifyToken, isAdmin, getAllDailyCollections);
router.put("/daily-collection/:id", verifyToken, isAdmin, updateDailyCollectionById);
router.delete("/daily-collection/:id", verifyToken, isAdmin, deleteDailyCollectionById);

// reschedule loan apies
router.post("/create-reschedule", verifyToken, isAdmin, createReschedule);
router.get("/reschedules", verifyToken, isAdmin, getAllReschedules);

// Reports route
router.get("/reports", verifyToken, isAdmin, getReports); // Add route for fetching reports
router.get("/reports/daily", verifyToken, isAdmin, getDailyReport);
router.get("/reports/weekly", verifyToken, isAdmin, getWeeklyReport);
router.get("/reports/custom", verifyToken, isAdmin, getCustomReport);

module.exports = router;
