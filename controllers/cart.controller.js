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

// Helper: parse guest cart from cookies
const getGuestCartItems = (req) => {
  try {
    const raw = req.cookies?.guest_cart;
    if (!raw) return [];
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

// View Cart
exports.getCart = async (req, res, next) => {
  try {
    let validItems = [];

    if (req.user) {
      // Logged in user: load from MongoDB
      let cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
      if (cart && cart.items) {
        validItems = cart.items.filter(item => item.productId && item.productId.isActive);
      }
    } else {
      // Guest user: populate items from cookie
      const guestItems = getGuestCartItems(req);
      if (guestItems.length > 0) {
        const productIds = guestItems.map(i => i.productId);
        const products = await Product.find({ _id: { $in: productIds }, isActive: true });
        
        validItems = guestItems
          .map(gi => {
            const prod = products.find(p => p._id.toString() === gi.productId.toString());
            if (!prod) return null;
            return {
              productId: prod,
              quantity: gi.quantity,
              priceSnapshot: gi.priceSnapshot || prod.price
            };
          })
          .filter(Boolean);
      }
    }

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
    const { productId, quantity = 1, buyNow } = req.body;
    const qty = Math.max(1, parseInt(quantity, 10));

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(404).json({ success: false, message: 'Product is unavailable.' });
      }
      return res.redirect('back');
    }

    if (product.stock < qty) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, message: `Only ${product.stock} items in stock.` });
      }
      return res.redirect('back');
    }

    const effectivePrice = (product.discountPrice > 0 && product.discountPrice < product.price)
      ? product.discountPrice
      : product.price;

    let totalCartCount = 0;

    if (req.user) {
      // Logged in user: save in MongoDB
      let cart = await Cart.findOne({ userId: req.user._id });
      if (!cart) {
        cart = new Cart({ userId: req.user._id, items: [] });
      }

      const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
      if (itemIndex > -1) {
        const newQty = cart.items[itemIndex].quantity + qty;
        cart.items[itemIndex].quantity = Math.min(newQty, product.stock);
        cart.items[itemIndex].priceSnapshot = effectivePrice;
      } else {
        cart.items.push({
          productId: product._id,
          quantity: qty,
          priceSnapshot: effectivePrice
        });
      }

      await cart.save();
      totalCartCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    } else {
      // Guest user: save in cookie
      let guestItems = getGuestCartItems(req);
      const itemIndex = guestItems.findIndex(i => i.productId.toString() === productId);

      if (itemIndex > -1) {
        const newQty = guestItems[itemIndex].quantity + qty;
        guestItems[itemIndex].quantity = Math.min(newQty, product.stock);
        guestItems[itemIndex].priceSnapshot = effectivePrice;
      } else {
        guestItems.push({
          productId: product._id.toString(),
          quantity: qty,
          priceSnapshot: effectivePrice
        });
      }

      res.cookie('guest_cart', JSON.stringify(guestItems), {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax'
      });
      totalCartCount = guestItems.reduce((sum, i) => sum + i.quantity, 0);
    }

    // If request is AJAX, return JSON without route change
    if (req.xhr || req.headers.accept?.includes('application/json') || req.body.ajax === 'true') {
      return res.json({
        success: true,
        count: totalCartCount,
        message: `"${product.name}" added to cart! It will stay in your cart.`
      });
    }

    // Buy Now goes directly to checkout
    if (buyNow === 'true') {
      return res.redirect('/checkout');
    }

    // Default form submission: redirect back to product page or cart
    const referer = req.get('referer');
    if (referer && !referer.includes('/cart')) {
      return res.redirect(`${referer}${referer.includes('?') ? '&' : '?'}added=true`);
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

    if (req.user) {
      // Logged in user
      const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
      if (cart) {
        const item = cart.items.find(i => i.productId._id.toString() === productId);
        if (item) {
          if (action === 'inc') {
            if (item.quantity + 1 <= item.productId.stock) {
              item.quantity += 1;
            }
          } else if (action === 'dec') {
            if (item.quantity > 1) {
              item.quantity -= 1;
            } else {
              cart.items = cart.items.filter(i => i.productId._id.toString() !== productId);
            }
          }
          await cart.save();
        }
      }
    } else {
      // Guest user
      let guestItems = getGuestCartItems(req);
      const item = guestItems.find(i => i.productId.toString() === productId);
      if (item) {
        if (action === 'inc') {
          item.quantity += 1;
        } else if (action === 'dec') {
          if (item.quantity > 1) {
            item.quantity -= 1;
          } else {
            guestItems = guestItems.filter(i => i.productId.toString() !== productId);
          }
        }
        res.cookie('guest_cart', JSON.stringify(guestItems), {
          maxAge: 30 * 24 * 60 * 60 * 1000,
          httpOnly: true,
          sameSite: 'lax'
        });
      }
    }

    res.redirect('/cart');
  } catch (error) {
    next(error);
  }
};

// Remove from Cart
exports.postRemoveFromCart = async (req, res, next) => {
  try {
    const { productId } = req.body;

    if (req.user) {
      await Cart.findOneAndUpdate(
        { userId: req.user._id },
        { $pull: { items: { productId } } }
      );
    } else {
      let guestItems = getGuestCartItems(req);
      guestItems = guestItems.filter(i => i.productId.toString() !== productId);
      res.cookie('guest_cart', JSON.stringify(guestItems), {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax'
      });
    }

    res.redirect('/cart');
  } catch (error) {
    next(error);
  }
};

