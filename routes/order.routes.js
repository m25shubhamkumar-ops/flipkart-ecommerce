const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/checkout', requireAuth, orderController.getCheckout);
router.post('/checkout', requireAuth, orderController.postCreateOrder);

router.get('/orders', requireAuth, orderController.getMyOrders);
router.get('/orders/:id', requireAuth, orderController.getOrderDetail);
router.post('/orders/:id/cancel', requireAuth, orderController.postCancelOrder);
router.post('/orders/:id/return', requireAuth, orderController.postRequestReturn);

module.exports = router;

