const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, default: '' },
    comment: { type: String, required: true, trim: true },
    isVerifiedPurchase: { type: Boolean, default: true }
  },
  { timestamps: true }
);

reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
