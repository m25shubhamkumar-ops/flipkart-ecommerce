const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/wishlist', requireAuth, wishlistController.getWishlist);
router.post('/wishlist/toggle', requireAuth, wishlistController.postToggleWishlist);

module.exports = router;
