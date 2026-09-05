const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/cart', cartController.getCart);
router.get('/cart/count', cartController.getCartCount);
router.post('/cart/add', cartController.postAddToCart);
router.post('/cart/update', cartController.postUpdateQuantity);
router.post('/cart/remove', cartController.postRemoveFromCart);


module.exports = router;
