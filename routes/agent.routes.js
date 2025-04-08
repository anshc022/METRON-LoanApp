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

module.exports = router;
