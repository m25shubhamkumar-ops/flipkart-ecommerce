const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const { formatPrice } = require('../utils/helpers');

// Helper to compute server-side totals safely
const calculateCartTotals = (items) => {
  let subtotal = 0;
  let totalDiscount = 0;

  items.forEach(item => {
    if (item.productId) {
      const originalPrice = item.productId.price;
      const currentPrice = (item.productId.discountPrice > 0 && item.productId.discountPrice < originalPrice)
        ? item.productId.discountPrice
        : originalPrice;
      
      subtotal += originalPrice * item.quantity;
      totalDiscount += (originalPrice - currentPrice) * item.quantity;
    }
  });

  const finalItemsPrice = subtotal - totalDiscount;
  const shipping = (finalItemsPrice > 500 || items.length === 0) ? 0 : 40;
  const grandTotal = finalItemsPrice + shipping;

  return {
    subtotal,
    totalDiscount,
    shipping,
    grandTotal
  };
};

// View Cart
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');

    if (!cart) {
      cart = { items: [] };
    }

    // Filter out deleted products if any
    const validItems = cart.items.filter(item => item.productId && item.productId.isActive);
    const totals = calculateCartTotals(validItems);

    res.render('cart/index', {
      title: 'Shopping Cart - Flipkart',
      items: validItems,
      totals,
      formatPrice
    });
  } catch (error) {
    next(error);
  }
};

// Add to Cart
exports.postAddToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = Math.max(1, parseInt(quantity, 10));

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product is unavailable.' });
    }

    if (product.stock < qty) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items in stock.`
      });
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    const effectivePrice = (product.discountPrice > 0 && product.discountPrice < product.price)
      ? product.discountPrice
      : product.price;

    if (itemIndex > -1) {
      const newQty = cart.items[itemIndex].quantity + qty;
      if (newQty > product.stock) {
        return res.redirect('/cart?error=stock_exceeded');
      }
      cart.items[itemIndex].quantity = newQty;
      cart.items[itemIndex].priceSnapshot = effectivePrice;
    } else {
      cart.items.push({
        productId: product._id,
        quantity: qty,
        priceSnapshot: effectivePrice
      });
    }

    await cart.save();

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, count: cart.items.reduce((sum, i) => sum + i.quantity, 0) });
    }

    res.redirect('/cart');
  } catch (error) {
    next(error);
  }
};

// Update Cart Quantity
exports.postUpdateQuantity = async (req, res, next) => {
  try {
    const { productId, action } = req.body; // action: 'inc' or 'dec'
    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');

    if (!cart) return res.redirect('/cart');

    const item = cart.items.find(i => i.productId._id.toString() === productId);
    if (!item) return res.redirect('/cart');

    if (action === 'inc') {
      if (item.quantity + 1 > item.productId.stock) {
        return res.redirect('/cart?error=stock_limit');
      }
      item.quantity += 1;
    } else if (action === 'dec') {
      if (item.quantity > 1) {
        item.quantity -= 1;
      } else {
        cart.items = cart.items.filter(i => i.productId._id.toString() !== productId);
      }
    }

    await cart.save();
    res.redirect('/cart');
  } catch (error) {
    next(error);
  }
};

// Remove from Cart
exports.postRemoveFromCart = async (req, res, next) => {
  try {
    const { productId } = req.body;
    await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { $pull: { items: { productId } } }
    );
    res.redirect('/cart');
  } catch (error) {
    next(error);
  }
};
