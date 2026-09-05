const Order = require('../models/order.model');
const { formatPrice, formatDate } = require('../utils/helpers');

// Delivery Partner Dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const agentId = req.user._id;

    const totalAssigned = await Order.countDocuments({ deliveryAgentId: agentId });
    const activeDeliveries = await Order.countDocuments({
      deliveryAgentId: agentId,
      orderStatus: { $in: ['Shipped', 'Out for Delivery'] }
    });
    const completedToday = await Order.countDocuments({
      deliveryAgentId: agentId,
      orderStatus: 'Delivered',
      updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    const pendingShipments = await Order.find({
      deliveryAgentId: agentId,
      orderStatus: { $in: ['Confirmed', 'Packed', 'Shipped', 'Out for Delivery'] }
    })
      .populate('userId', 'name email phone')
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean();

    res.render('delivery/dashboard', {
      title: 'Delivery Partner Portal - Flipkart Logistics',
      stats: { totalAssigned, activeDeliveries, completedToday },
      shipments: pendingShipments,
      formatPrice,
      formatDate
    });
  } catch (error) {
    next(error);
  }
};

// All Assigned Shipments
exports.getOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { deliveryAgentId: req.user._id };

    if (status && status !== 'all') {
      if (status === 'active') {
        filter.orderStatus = { $in: ['Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Return Confirmed', 'Return Approved', 'Out for Return'] };
      } else if (status === 'delivered') {
        filter.orderStatus = 'Delivered';
      } else if (status === 'returns') {
        filter.orderStatus = { $in: ['Return Confirmed', 'Return Approved', 'Out for Return', 'Return Picked Up', 'Return Cancelled'] };
      } else {
        filter.orderStatus = status;
      }
    }

    const orders = await Order.find(filter)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    res.render('delivery/orders', {
      title: 'Assigned Shipments - Flipkart Delivery Partner',
      orders,
      currentFilter: status || 'all',
      formatPrice,
      formatDate
    });
  } catch (error) {
    next(error);
  }
};

// Shipment Detail View
exports.getOrderDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({
      _id: id,
      deliveryAgentId: req.user._id
    })
      .populate('userId', 'name email phone')
      .lean();

    if (!order) {
      return res.status(404).render('errors/404', {
        title: 'Shipment Not Found',
        message: 'This shipment is either not assigned to you or does not exist.'
      });
    }

    res.render('delivery/order-detail', {
      title: `Shipment #${order.orderNumber} - Delivery Portal`,
      order,
      formatPrice,
      formatDate
    });
  } catch (error) {
    next(error);
  }
};

// Update Shipment Status by Delivery Agent
exports.postUpdateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, deliveryNotes } = req.body;

    const allowedStatuses = [
      'Shipped',
      'Out for Delivery',
      'Delivered',
      'Undelivered',
      'Return Confirmed',
      'Out for Return',
      'Return Picked Up',
      'Return Cancelled'
    ];
    if (!allowedStatuses.includes(status)) {
      return res.redirect(`/delivery/orders/${id}?error=invalid_status`);
    }

    const order = await Order.findOne({
      _id: id,
      deliveryAgentId: req.user._id
    });

    if (!order) {
      return res.status(404).redirect('/delivery/orders');
    }

    order.orderStatus = status;
    if (deliveryNotes) {
      order.deliveryNotes = deliveryNotes.trim();
    }

    // Sync return details if reverse logistics status
    if (status === 'Out for Return') {
      if (!order.returnDetails) order.returnDetails = {};
      order.returnDetails.status = 'out_for_pickup';
    } else if (status === 'Return Picked Up') {
      if (!order.returnDetails) order.returnDetails = {};
      order.returnDetails.status = 'picked_up';
    } else if (status === 'Return Cancelled') {
      if (!order.returnDetails) order.returnDetails = {};
      order.returnDetails.status = 'cancelled';
    }

    // If delivered and payment was COD, automatically mark payment collected
    if (status === 'Delivered' && order.paymentMethod === 'COD') {
      order.paymentStatus = 'completed';
    }

    let statusMsg = `Status updated to ${status} by Delivery Agent ${req.user.name}.`;
    if (deliveryNotes) {
      statusMsg += ` Remarks: ${deliveryNotes.trim()}`;
    }

    order.statusTimeline.push({
      status,
      message: statusMsg,
      timestamp: new Date(),
      updatedBy: req.user._id
    });

    await order.save();
    res.redirect(`/delivery/orders/${id}?updated=true`);
  } catch (error) {
    next(error);
  }
};

// Delivery History View
exports.getHistory = async (req, res, next) => {
  try {
    const orders = await Order.find({
      deliveryAgentId: req.user._id,
      orderStatus: 'Delivered'
    })
      .sort({ updatedAt: -1 })
      .lean();

    res.render('delivery/history', {
      title: 'Delivery History - Flipkart Logistics',
      orders,
      formatPrice,
      formatDate
    });
  } catch (error) {
    next(error);
  }
};
