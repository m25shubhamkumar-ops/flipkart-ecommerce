const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Order = require('../models/order.model');
const Address = require('../models/address.model');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).lean();
    const orderCount = await Order.countDocuments({ userId: req.user._id });
    const addressCount = await Address.countDocuments({ userId: req.user._id });

    res.render('profile/index', {
      title: 'My Profile - Flipkart',
      user,
      orderCount,
      addressCount,
      success: req.query.saved ? 'Profile updated successfully.' : null,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

exports.postUpdateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      name: name ? name.trim() : req.user.name,
      phone: phone ? phone.trim() : req.user.phone
    });
    res.redirect('/profile?saved=true');
  } catch (error) {
    next(error);
  }
};

exports.postChangePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.render('profile/index', {
        title: 'My Profile - Flipkart',
        user,
        orderCount: 0,
        addressCount: 0,
        error: 'Current password is incorrect.',
        success: null
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.render('profile/index', {
        title: 'My Profile - Flipkart',
        user,
        orderCount: 0,
        addressCount: 0,
        error: 'New passwords do not match.',
        success: null
      });
    }

    if (newPassword.length < 6) {
      return res.render('profile/index', {
        title: 'My Profile - Flipkart',
        user,
        orderCount: 0,
        addressCount: 0,
        error: 'Password must be at least 6 characters.',
        success: null
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.render('profile/index', {
      title: 'My Profile - Flipkart',
      user,
      orderCount: 0,
      addressCount: 0,
      success: 'Password changed successfully!',
      error: null
    });
  } catch (error) {
    next(error);
  }
};
