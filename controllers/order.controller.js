const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const Address = require('../models/address.model');
const { formatPrice, formatDate, generateOrderNumber } = require('../utils/helpers');

// Checkout Page
exports.getCheckout = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart');
    }

    // Filter valid active items
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

    // Calculate server totals
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
      formatPrice
    });
  } catch (error) {
    next(error);
  }
};

// Place Order
exports.postCreateOrder = async (req, res, next) => {
  try {
    const { addressId, paymentMethod = 'COD' } = req.body;

    if (!addressId) {
      return res.status(400).render('errors/500', {
        title: 'Checkout Error',
        message: 'Please select a delivery address.',
        stack: null
      });
    }

    const address = await Address.findOne({ _id: addressId, userId: req.user._id });
    if (!address) {
      return res.status(404).render('errors/500', {
        title: 'Address Not Found',
        message: 'The selected delivery address could not be found.',
        stack: null
      });
    }

    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart');
    }

    const orderItems = [];
    let subtotal = 0;
    let totalDiscount = 0;

    // Strict stock verification and price recalculation
    for (const item of cart.items) {
      const product = await Product.findById(item.productId._id);
      if (!product || product.stock < item.quantity) {
        return res.status(400).render('errors/500', {
          title: 'Stock Error',
          message: `Product "${item.productId.name}" does not have enough stock available.`,
          stack: null
        });
      }

      const orig = product.price;
      const effective = (product.discountPrice > 0 && product.discountPrice < orig) ? product.discountPrice : orig;
      const itemSubtotal = effective * item.quantity;

      subtotal += orig * item.quantity;
      totalDiscount += (orig - effective) * item.quantity;

      orderItems.push({
        productId: product._id,
        name: product.name,
        image: product.images?.[0] || '',
        price: orig,
        discountPrice: effective,
        quantity: item.quantity,
        subtotal: itemSubtotal
      });

      // Atomically decrement stock
      await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
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
        phone: address.phone,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country
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

    // Clear cart after successful order creation
    await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });

    res.redirect(`/orders/${order._id}?placed=true`);
  } catch (error) {
    next(error);
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
    
    // Customers can only see their own orders, delivery agents and admins can view
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

    // Step order tracking progression
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

// Cancel Order (only if Placed or Confirmed)
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

    // Restore stock to inventory
    for (const item of order.items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
      }
    }

    order.orderStatus = 'Cancelled';
    order.statusTimeline.push({
      status: 'Cancelled',
      message: 'Order was cancelled by the customer.',
      timestamp: new Date(),
      updatedBy: req.user._id
    });

    await order.save();
    res.redirect(`/orders/${order._id}`);
  } catch (error) {
    next(error);
  }
};
