const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const reviewController = require('../controllers/review.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', productController.getHome);
router.get('/products', productController.getProducts);
router.get('/products/:slug', productController.getProductDetail);
router.post('/products/:productId/reviews', requireAuth, reviewController.postCreateReview);

module.exports = router;
