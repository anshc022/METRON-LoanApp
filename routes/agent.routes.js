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
const { createCollection, getCollectionById, getAllCollections, updateCollectionById, deleteCollectionById, getCollectionsByLoanId } = require("../controllers/collection.controller");

//shop management
router.post("/create-shop", verifyToken, isAgent, createShop);
router.get("/shop/:id", verifyToken, isAgent, getShopById);
router.get("/shops", verifyToken, isAgent, getAllShops);
router.put("/shop/:id", verifyToken, isAgent, updateShopById);

//loan management
router.post("/create-loan", verifyToken, isAgent, createLoan);
router.put("/loan/:id", verifyToken, isAgent, updateLoanById);
router.get("/loan/:id", verifyToken, isAgent, getLoanById);
router.get("/loans", verifyToken, isAgent, getAllLoans);



//Collection management
router.post("/create-collection", verifyToken, isAgent, createCollection);
router.get("/collection/:id", verifyToken, isAgent, getCollectionById);
router.get("/collections", verifyToken, isAgent, getAllCollections);
router.put("/collection/:id", verifyToken, isAgent, updateCollectionById);
router.delete("/collection/:id", verifyToken, isAgent, deleteCollectionById);

//advance collection apies
router.get("/collections/loan/:id", verifyToken, isAgent, getCollectionsByLoanId);

module.exports = router;
