const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const Address = require('../models/address.model');
const { formatPrice, formatDate, generateOrderNumber } = require('../utils/helpers');

// Checkout Page
exports.getCheckout = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.redirect('/cart');
    }

    const validItems = cart.items.filter(item => item.productId && item.productId.isActive);
    if (validItems.length === 0) {
      return res.redirect('/cart');
    }

    // Check stock for all items
    for (const item of validItems) {
      if (item.productId.stock < item.quantity) {
        return res.redirect(`/cart?error=out_of_stock&product=${encodeURIComponent(item.productId.name)}`);
      }
    }

    // Calculate totals server-side
    let subtotal = 0;
    let totalDiscount = 0;
    validItems.forEach(item => {
      const orig = item.productId.price;
      const current = (item.productId.discountPrice > 0 && item.productId.discountPrice < orig) ? item.productId.discountPrice : orig;
      subtotal += orig * item.quantity;
      totalDiscount += (orig - current) * item.quantity;
    });

    const finalItemsPrice = subtotal - totalDiscount;
    const shipping = finalItemsPrice > 500 ? 0 : 40;
    const grandTotal = finalItemsPrice + shipping;

    const addresses = await Address.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

    res.render('checkout/index', {
      title: 'Checkout - Flipkart',
      items: validItems,
      addresses,
      totals: { subtotal, discount: totalDiscount, shipping, grandTotal },
      error: req.query.error || null,
      formatPrice
    });
  } catch (error) {
    next(error);
  }
};

// Place Order
exports.postCreateOrder = async (req, res, next) => {
  try {
    const { addressId, paymentMethod = 'COD', fullName, phone, line1, line2, city, state, pincode } = req.body;

    let address = null;

    // 1. Try finding existing selected address
    if (addressId && mongoose.Types.ObjectId.isValid(addressId)) {
      address = await Address.findOne({ _id: addressId, userId: req.user._id });
    }

    // 2. If no address selected or new address was filled in
    if (!address && fullName && line1 && city && pincode) {
      const isFirst = (await Address.countDocuments({ userId: req.user._id })) === 0;
      address = await Address.create({
        userId: req.user._id,
        fullName: fullName.trim(),
        phone: (phone || req.user.phone || '9876543210').trim(),
        line1: line1.trim(),
        line2: (line2 || '').trim(),
        city: city.trim(),
        state: (state || 'Karnataka').trim(),
        pincode: pincode.trim(),
        isDefault: isFirst
      });
    }

    // 3. If STILL no address, redirect to checkout with clear message (NEVER 500!)
    if (!address) {
      return res.redirect('/checkout?error=' + encodeURIComponent('Please select or provide a complete delivery address.'));
    }

    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.redirect('/cart');
    }

    const orderItems = [];
    let subtotal = 0;
    let totalDiscount = 0;

    // Strict stock verification and price recalculation
    for (const item of cart.items) {
      const prodId = item.productId?._id || item.productId;
      if (!prodId) continue;

      const product = await Product.findById(prodId);
      if (!product || !product.isActive) continue;

      if (product.stock < item.quantity) {
        return res.redirect(`/checkout?error=` + encodeURIComponent(`Product "${product.name}" is out of stock.`));
      }

      const orig = product.price;
      const effective = (product.discountPrice > 0 && product.discountPrice < orig) ? product.discountPrice : orig;
      const itemSubtotal = effective * item.quantity;

      subtotal += orig * item.quantity;
      totalDiscount += (orig - effective) * item.quantity;

      orderItems.push({
        productId: product._id,
        name: product.name,
        image: product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200',
        price: orig,
        discountPrice: effective,
        quantity: item.quantity,
        subtotal: itemSubtotal
      });

      // Atomically decrement stock
      await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
    }

    if (orderItems.length === 0) {
      return res.redirect('/cart?error=' + encodeURIComponent('No valid products in cart to order.'));
    }

    const finalItemsPrice = subtotal - totalDiscount;
    const shipping = finalItemsPrice > 500 ? 0 : 40;
    const grandTotal = finalItemsPrice + shipping;

    const orderNumber = generateOrderNumber();

    const order = await Order.create({
      userId: req.user._id,
      orderNumber,
      items: orderItems,
      totals: {
        subtotal,
        shipping,
        discount: totalDiscount,
        grandTotal
      },
      addressSnapshot: {
        fullName: address.fullName,
        phone: address.phone || req.user.phone,
        line1: address.line1,
        line2: address.line2 || '',
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country || 'India'
      },
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'pending' : 'completed',
      orderStatus: 'Placed',
      statusTimeline: [
        {
          status: 'Placed',
          message: 'Order received and confirmed by Flipkart.',
          timestamp: new Date(),
          updatedBy: req.user._id
        }
      ]
    });

    // Empty cart
    await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });

    res.redirect(`/orders/${order._id}?placed=true`);
  } catch (error) {
    console.error('[Create Order Error]:', error);
    res.redirect('/checkout?error=' + encodeURIComponent(error.message || 'Unable to place order. Please try again.'));
  }
};

// Customer Orders List
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.render('orders/index', {
      title: 'My Orders - Flipkart',
      orders,
      formatPrice,
      formatDate
    });
  } catch (error) {
    next(error);
  }
};

// Customer Order Detail & Live Tracking
exports.getOrderDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = { _id: id };
    
    if (req.user.role === 'customer') {
      query.userId = req.user._id;
    }

    const order = await Order.findOne(query)
      .populate('deliveryAgentId', 'name phone')
      .lean();

    if (!order) {
      return res.status(404).render('errors/404', {
        title: 'Order Not Found',
        message: 'Could not find the requested order.'
      });
    }

    const steps = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
    const currentStepIndex = steps.indexOf(order.orderStatus);

    res.render('orders/show', {
      title: `Order #${order.orderNumber} Details - Flipkart`,
      order,
      steps,
      currentStepIndex,
      isNewlyPlaced: req.query.placed === 'true',
      formatPrice,
      formatDate
    });
  } catch (error) {
    next(error);
  }
};

// Cancel Order
exports.postCancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ _id: id, userId: req.user._id });

    if (!order) {
      return res.status(404).redirect('/orders');
    }

    if (!['Placed', 'Confirmed'].includes(order.orderStatus)) {
      return res.redirect(`/orders/${order._id}?error=cannot_cancel`);
    }

    for (const item of order.items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
      }
    }

    order.orderStatus = 'Cancelled';
    order.statusTimeline.push({
      status: 'Cancelled',
      message: 'Order was cancelled by customer.',
      timestamp: new Date(),
      updatedBy: req.user._id
    });

    await order.save();
    res.redirect(`/orders/${order._id}`);
  } catch (error) {
    next(error);
  }
};
