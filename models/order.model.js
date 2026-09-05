const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  price: { type: Number, required: true },
  discountPrice: { type: Number, default: 0 },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderNumber: { type: String, required: true, unique: true },
    items: [orderItemSchema],
    totals: {
      subtotal: { type: Number, required: true },
      shipping: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      grandTotal: { type: Number, required: true }
    },
    addressSnapshot: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      line2: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' }
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'Mock_Card', 'Mock_UPI'],
      default: 'COD'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    orderStatus: {
      type: String,
      enum: ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Undelivered'],
      default: 'Placed',
      index: true
    },
    deliveryAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    deliveryNotes: { type: String, default: '' },
    statusTimeline: [
      {
        status: { type: String, required: true },
        message: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
      }
    ]
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
