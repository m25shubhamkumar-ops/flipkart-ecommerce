const Wishlist = require('../models/wishlist.model');
const { formatPrice } = require('../utils/helpers');

exports.getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user._id })
      .populate('productIds')
      .lean();

    const products = wishlist ? wishlist.productIds.filter(p => p && p.isActive) : [];

    res.render('wishlist/index', {
      title: 'My Wishlist - Flipkart',
      products,
      formatPrice
    });
  } catch (error) {
    next(error);
  }
};

exports.postToggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ userId: req.user._id });

    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.user._id, productIds: [productId] });
      await wishlist.save();
      return res.redirect('back');
    }

    const index = wishlist.productIds.indexOf(productId);
    if (index > -1) {
      wishlist.productIds.splice(index, 1);
    } else {
      wishlist.productIds.push(productId);
    }

    await wishlist.save();
    res.redirect('back');
  } catch (error) {
    next(error);
  }
};
