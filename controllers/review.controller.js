const Review = require('../models/review.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');

exports.postCreateReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment } = req.body;

    // Verify user purchased product
    const deliveredOrder = await Order.findOne({
      userId: req.user._id,
      orderStatus: 'Delivered',
      'items.productId': productId
    });

    if (!deliveredOrder) {
      return res.redirect(`/products/${productId}?error=not_eligible_review`);
    }

    // Check duplicate
    const existing = await Review.findOne({ userId: req.user._id, productId });
    if (existing) {
      return res.redirect(`/products/${productId}?error=already_reviewed`);
    }

    await Review.create({
      userId: req.user._id,
      productId,
      orderId: deliveredOrder._id,
      rating: Number(rating),
      title: title ? title.trim() : '',
      comment: comment.trim(),
      isVerifiedPurchase: true
    });

    // Recalculate average rating & count
    const stats = await Review.aggregate([
      { $match: { productId: deliveredOrder.items[0].productId } },
      {
        $group: {
          _id: '$productId',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        ratingAvg: Math.round(stats[0].avgRating * 10) / 10,
        ratingCount: stats[0].count
      });
    }

    res.redirect(`/products/${productId}?reviewed=true`);
  } catch (error) {
    next(error);
  }
};
