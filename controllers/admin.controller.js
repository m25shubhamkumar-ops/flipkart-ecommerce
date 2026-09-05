const Product = require('../models/product.model');
const Category = require('../models/category.model');
const Order = require('../models/order.model');
const User = require('../models/user.model');
const LoginActivity = require('../models/loginActivity.model');
const { slugify, formatPrice, formatDate } = require('../utils/helpers');

// Admin Dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalDeliveryAgents = await User.countDocuments({ role: 'delivery' });
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({ stock: { $lte: 5 } });

    // Calculate total revenue
    const revenueAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totals.grandTotal' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Recent 5 Orders
    const recentOrders = await Order.find()
      .populate('userId', 'name email')
      .populate('deliveryAgentId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Critical low stock items
    const lowStockList = await Product.find({ stock: { $lte: 5 } }).limit(5).lean();

    res.render('admin/dashboard', {
      title: 'Admin Control Center - Flipkart',
      stats: {
        totalOrders,
        totalUsers,
        totalDeliveryAgents,
        totalProducts,
        lowStockProducts,
        totalRevenue
      },
      recentOrders,
      lowStockList,
      formatPrice,
      formatDate
    });
  } catch (error) {
    next(error);
  }
};

// Admin Products CRUD
exports.getProducts = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { brand: { $regex: search.trim(), $options: 'i' } }
      ];
    }
    if (category) {
      filter.categoryId = category;
    }

    const products = await Product.find(filter)
      .populate('categoryId')
      .sort({ createdAt: -1 })
      .lean();

    const categories = await Category.find({ isActive: true }).lean();

    res.render('admin/products', {
      title: 'Product Catalog Management - Admin',
      products,
      categories,
      query: req.query,
      formatPrice
    });
  } catch (error) {
    next(error);
  }
};

exports.getNewProduct = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).lean();
    res.render('admin/product-form', {
      title: 'Add New Product - Admin',
      product: null,
      categories,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

exports.postCreateProduct = async (req, res, next) => {
  try {
    const { name, description, price, discountPrice, categoryId, brand, stock, images } = req.body;
    const categories = await Category.find({ isActive: true }).lean();

    if (!name || !price || !categoryId) {
      return res.render('admin/product-form', {
        title: 'Add New Product - Admin',
        product: req.body,
        categories,
        error: 'Please enter name, price, and select a category.'
      });
    }

    let slug = slugify(name);
    const existing = await Product.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const imageArray = images ? images.split(',').map(s => s.trim()).filter(Boolean) : [];

    await Product.create({
      name: name.trim(),
      slug,
      description: description ? description.trim() : '',
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : 0,
      categoryId,
      brand: brand ? brand.trim() : 'Flipkart Assured',
      stock: Number(stock) || 0,
      images: imageArray.length > 0 ? imageArray : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80']
    });

    res.redirect('/admin/products');
  } catch (error) {
    next(error);
  }
};

exports.getEditProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.redirect('/admin/products');
    const categories = await Category.find({ isActive: true }).lean();

    res.render('admin/product-form', {
      title: `Edit ${product.name} - Admin`,
      product,
      categories,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

exports.postUpdateProduct = async (req, res, next) => {
  try {
    const { name, description, price, discountPrice, categoryId, brand, stock, images, isActive } = req.body;
    const imageArray = images ? images.split(',').map(s => s.trim()).filter(Boolean) : [];

    await Product.findByIdAndUpdate(req.params.id, {
      name: name.trim(),
      description: description ? description.trim() : '',
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : 0,
      categoryId,
      brand: brand ? brand.trim() : 'Generic',
      stock: Number(stock) || 0,
      images: imageArray.length > 0 ? imageArray : undefined,
      isActive: isActive === 'on' || isActive === true
    });

    res.redirect('/admin/products');
  } catch (error) {
    next(error);
  }
};

exports.postDeleteProduct = async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/admin/products');
  } catch (error) {
    next(error);
  }
};

// Admin Categories CRUD
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().lean();
    res.render('admin/categories', {
      title: 'Category Hierarchy - Admin',
      categories,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

exports.postCreateCategory = async (req, res, next) => {
  try {
    const { name, image } = req.body;
    if (!name) return res.redirect('/admin/categories');

    const slug = slugify(name);
    await Category.create({
      name: name.trim(),
      slug,
      image: image ? image.trim() : ''
    });

    res.redirect('/admin/categories');
  } catch (error) {
    next(error);
  }
};

exports.postDeleteCategory = async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.redirect('/admin/categories');
  } catch (error) {
    next(error);
  }
};

// Admin Orders Queue & Delivery Assignment
exports.getOrders = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status && status !== 'all') {
      filter.orderStatus = status;
    }
    if (search) {
      filter.orderNumber = { $regex: search.trim(), $options: 'i' };
    }

    const orders = await Order.find(filter)
      .populate('userId', 'name email phone')
      .populate('deliveryAgentId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    // Fetch all active delivery agents for the assignment dropdown
    const deliveryAgents = await User.find({ role: 'delivery', isActive: true }).select('name email phone').lean();

    res.render('admin/orders', {
      title: 'Master Orders Queue & Dispatch - Admin',
      orders,
      deliveryAgents,
      currentFilter: status || 'all',
      query: req.query,
      formatPrice,
      formatDate
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderDetail = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('deliveryAgentId', 'name email phone')
      .lean();

    if (!order) return res.redirect('/admin/orders');

    const deliveryAgents = await User.find({ role: 'delivery', isActive: true }).select('name email phone').lean();

    res.render('admin/order-detail', {
      title: `Order #${order.orderNumber} Management - Admin`,
      order,
      deliveryAgents,
      formatPrice,
      formatDate
    });
  } catch (error) {
    next(error);
  }
};

exports.postUpdateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus, deliveryAgentId, notes } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.redirect('/admin/orders');

    const prevStatus = order.orderStatus;
    if (orderStatus) {
      order.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    if (deliveryAgentId !== undefined) {
      order.deliveryAgentId = deliveryAgentId || null;
    }

    if (notes) {
      order.deliveryNotes = notes;
    }

    order.statusTimeline.push({
      status: orderStatus || prevStatus,
      message: `Updated by Admin: Status is ${orderStatus || prevStatus}, Payment is ${paymentStatus || order.paymentStatus}.${notes ? ` Note: ${notes}` : ''}`,
      timestamp: new Date(),
      updatedBy: req.user._id
    });

    await order.save();
    res.redirect(`/admin/orders/${id}`);
  } catch (error) {
    next(error);
  }
};

// Admin Returns & Refund Management Portal
exports.getReturnRequests = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const returnStatuses = ['Return Requested', 'Return Approved', 'Return Picked Up', 'Returned & Refunded', 'Return Rejected'];
    
    const filter = {
      orderStatus: (status && status !== 'all') ? status : { $in: returnStatuses }
    };

    if (search) {
      filter.orderNumber = { $regex: search.trim(), $options: 'i' };
    }

    const orders = await Order.find(filter)
      .populate('userId', 'name email phone')
      .populate('deliveryAgentId', 'name email phone')
      .sort({ updatedAt: -1 })
      .lean();

    const deliveryAgents = await User.find({ role: 'delivery', isActive: true }).select('name email phone').lean();

    res.render('admin/returns', {
      title: 'Returns, Exchanges & Refunds Management - Admin',
      orders,
      deliveryAgents,
      currentFilter: status || 'all',
      query: req.query,
      success: req.query.success || null,
      error: req.query.error || null,
      formatPrice,
      formatDate
    });
  } catch (error) {
    next(error);
  }
};

// Admin Process Return Ticket
exports.postProcessReturnAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, deliveryAgentId, notes, refundAmount } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.redirect('/admin/returns');

    if (action === 'approve') {
      order.orderStatus = 'Return Approved';
      order.returnDetails.status = 'approved';
      if (deliveryAgentId) {
        order.deliveryAgentId = deliveryAgentId;
      }
      order.returnDetails.adminRemarks = notes || 'Return approved by Admin. Reverse pickup scheduled.';
      order.statusTimeline.push({
        status: 'Return Approved',
        message: `Admin approved return request. Reverse pickup assigned.${notes ? ` Note: ${notes}` : ''}`,
        timestamp: new Date(),
        updatedBy: req.user._id
      });
    } else if (action === 'reject') {
      order.orderStatus = 'Return Rejected';
      order.returnDetails.status = 'rejected';
      order.returnDetails.adminRemarks = notes || 'Return request rejected based on policy terms.';
      order.statusTimeline.push({
        status: 'Return Rejected',
        message: `Admin rejected return request. Reason: ${notes || 'Policy mismatch / condition failed'}`,
        timestamp: new Date(),
        updatedBy: req.user._id
      });
    } else if (action === 'complete_refund') {
      order.orderStatus = 'Returned & Refunded';
      order.returnDetails.status = 'refunded';
      order.paymentStatus = 'refunded';
      order.refundDetails.refundStatus = 'completed';
      order.refundDetails.amount = refundAmount ? parseFloat(refundAmount) : order.totals.grandTotal;
      order.refundDetails.transactionId = 'TXN_REF_' + Date.now().toString().slice(-8);
      order.refundDetails.processedAt = new Date();

      // Restore product stock back to warehouse
      for (const item of order.items) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
        }
      }

      order.statusTimeline.push({
        status: 'Returned & Refunded',
        message: `Admin verified returned package and processed full refund of ₹${order.refundDetails.amount}. Stock restocked.${notes ? ` Note: ${notes}` : ''}`,
        timestamp: new Date(),
        updatedBy: req.user._id
      });
    }

    await order.save();
    res.redirect(`/admin/returns?success=` + encodeURIComponent('Return action processed successfully.'));
  } catch (error) {
    next(error);
  }
};



// Admin Users Directory & Role Management
exports.getUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query;
    const filter = {};
    if (role && role !== 'all') {
      filter.role = role;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 }).lean();

    res.render('admin/users', {
      title: 'User & Role Management - Admin',
      users,
      currentRole: role || 'all',
      query: req.query,
      formatDate
    });
  } catch (error) {
    next(error);
  }
};

exports.postUpdateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['customer', 'delivery', 'admin'].includes(role)) {
      return res.redirect('/admin/users');
    }

    await User.findByIdAndUpdate(id, { role });
    res.redirect('/admin/users');
  } catch (error) {
    next(error);
  }
};

exports.postToggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (user) {
      user.isActive = !user.isActive;
      await user.save();
    }
    res.redirect('/admin/users');
  } catch (error) {
    next(error);
  }
};

// Admin Login Activity / Audit Trail (PDF Page 7)
exports.getLoginActivity = async (req, res, next) => {
  try {
    const { email, status, page = 1 } = req.query;
    const limit = 15;
    const skip = (parseInt(page, 10) - 1) * limit;

    const filter = {};
    if (email && email.trim()) {
      filter.email = { $regex: email.trim(), $options: 'i' };
    }
    if (status && status !== 'all') {
      filter.status = status;
    }

    const totalLogs = await LoginActivity.countDocuments(filter);
    const logs = await LoginActivity.find(filter)
      .sort({ loginTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.render('admin/login-activity', {
      title: 'Login Activity & Audit Trail - Admin',
      logs,
      totalLogs,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(totalLogs / limit),
      query: req.query,
      formatDate
    });
  } catch (error) {
    next(error);
  }
};
