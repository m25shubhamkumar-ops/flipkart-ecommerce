const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireDelivery } = require('../middleware/rbac.middleware');

// Apply auth and delivery role checks to all delivery routes
router.use('/delivery', requireAuth, requireDelivery);

router.get('/delivery', (req, res) => res.redirect('/delivery/dashboard'));
router.get('/delivery/dashboard', deliveryController.getDashboard);
router.get('/delivery/orders', deliveryController.getOrders);
router.get('/delivery/orders/:id', deliveryController.getOrderDetail);
router.post('/delivery/orders/:id/status', deliveryController.postUpdateStatus);
router.get('/delivery/history', deliveryController.getHistory);

module.exports = router;
