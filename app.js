require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const methodOverride = require('method-override');

const connectDB = require('./config/db');
const { attachUserOptional } = require('./middleware/auth.middleware');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');
const Cart = require('./models/cart.model');

// Route imports
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const orderRoutes = require('./routes/order.routes');
const profileRoutes = require('./routes/profile.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Database connection
connectDB();

// View engine setup (EJS SSR)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Security & Parsing Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Allows CDN resources (Tailwind, Icons, Unsplash)
  crossOriginEmbedderPolicy: false
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));

// Disable stale browser caching for SSR HTML pages (preserves real-time cart state on back/forward navigation)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/public') && !req.path.includes('.')) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});

// Global user attachment & cart counter middleware
app.use(attachUserOptional);
app.use(async (req, res, next) => {
  res.locals.cartCount = 0;
  if (req.user && req.user.role === 'customer') {
    try {
      const cart = await Cart.findOne({ userId: req.user._id });
      if (cart && cart.items) {
        res.locals.cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      }
    } catch (e) {
      res.locals.cartCount = 0;
    }
  } else if (!req.user) {
    try {
      const raw = req.cookies?.guest_cart;
      if (raw) {
        const guestItems = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(guestItems)) {
          res.locals.cartCount = guestItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
        }
      }
    } catch (e) {
      res.locals.cartCount = 0;
    }
  }
  res.locals.currentPath = req.path;
  next();
});


// Health check route (PDF Page 14)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount Routes
app.use('/', authRoutes);
app.use('/', productRoutes);
app.use('/', cartRoutes);
app.use('/', wishlistRoutes);
app.use('/', orderRoutes);
app.use('/', profileRoutes);
app.use('/', deliveryRoutes);
app.use('/', adminRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n🚀 Flipkart E-Commerce Server is running on http://localhost:${PORT}`);
    console.log(`📦 Active Roles: [Customer] [Delivery Agent] [Admin]`);
  });
}

module.exports = app;
