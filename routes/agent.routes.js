const express = require("express");
const router = express.Router();
const {
    createShop,
    getShopById,
    getAllShops,
    updateShopById,
} = require('../controllers/shop.controller')


const { verifyToken } = require("../middleware/auth.middleware");
const { isAgent } = require("../middleware/role.middleware");


//shop management 
router.post('/create-shop', verifyToken, isAgent, createShop);
router.get('/shop/:id', verifyToken, isAgent, getShopById);
router.get('/shops', verifyToken, isAgent, getAllShops);
router.put("/shop/:id", verifyToken, isAgent, updateShopById);







module.exports = router;