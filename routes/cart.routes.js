const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/cart', requireAuth, cartController.getCart);
router.post('/cart/add', requireAuth, cartController.postAddToCart);
router.post('/cart/update', requireAuth, cartController.postUpdateQuantity);
router.post('/cart/remove', requireAuth, cartController.postRemoveFromCart);

module.exports = router;
