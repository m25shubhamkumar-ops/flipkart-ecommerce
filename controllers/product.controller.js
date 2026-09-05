const Product = require('../models/product.model');
const Category = require('../models/category.model');
const Review = require('../models/review.model');
const Order = require('../models/order.model');
const Wishlist = require('../models/wishlist.model');
const { formatPrice } = require('../utils/helpers');

// Home Page
exports.getHome = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).lean();
    
    // Top Deals / Best Sellers (high discount)
    const dealProducts = await Product.find({ isActive: true, discountPrice: { $gt: 0 } })
      .populate('categoryId')
      .limit(6)
      .lean();

    // Featured / New Arrivals
    const featuredProducts = await Product.find({ isActive: true })
      .populate('categoryId')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    res.render('home', {
      title: 'Flipkart Online Shopping Site - Electronics, Mobiles, Fashion & More',
      categories,
      dealProducts,
      featuredProducts,
      formatPrice
    });
  } catch (error) {
    next(error);
  }
};

// Product Catalog & Search
exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, brand, minPrice, maxPrice, sort = 'newest', page = 1 } = req.query;
    const limit = 12;
    const skip = (parseInt(page, 10) - 1) * limit;

    const filter = { isActive: true };

    // Search query
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { brand: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // Category filter
    let selectedCategory = null;
    if (category) {
      selectedCategory = await Category.findOne({ slug: category });
      if (selectedCategory) {
        filter.categoryId = selectedCategory._id;
      }
    }

    // Brand filter
    if (brand) {
      filter.brand = brand;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Sort options
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { ratingAvg: -1 };

    const totalProducts = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('categoryId')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    // Data for filter sidebar
    const allCategories = await Category.find({ isActive: true }).lean();
    const brands = await Product.distinct('brand', { isActive: true });

    res.render('products/index', {
      title: search ? `Results for "${search}" - Flipkart` : 'Explore Products - Flipkart',
      products,
      allCategories,
      brands,
      selectedCategory,
      totalProducts,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(totalProducts / limit),
      query: req.query,
      formatPrice
    });
  } catch (error) {
    next(error);
  }
};

// Product Detail Page
exports.getProductDetail = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ $or: [{ slug }, { _id: slug.match(/^[0-9a-fA-F]{24}$/) ? slug : null }] })
      .populate('categoryId')
      .lean();

    if (!product) {
      return res.status(404).render('errors/404', {
        title: 'Product Not Found - Flipkart',
        message: 'The product you are looking for is no longer available.'
      });
    }

    // Fetch verified reviews
    const reviews = await Review.find({ productId: product._id })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Check if user has purchased this product (Delivered order) and hasn't reviewed yet
    let canReview = false;
    let inWishlist = false;

    if (req.user) {
      const deliveredOrder = await Order.findOne({
        userId: req.user._id,
        orderStatus: 'Delivered',
        'items.productId': product._id
      });

      const alreadyReviewed = await Review.findOne({
        userId: req.user._id,
        productId: product._id
      });

      if (deliveredOrder && !alreadyReviewed) {
        canReview = true;
      }

      const wishlist = await Wishlist.findOne({
        userId: req.user._id,
        productIds: product._id
      });
      inWishlist = !!wishlist;
    }

    // Similar products in same category
    const similarProducts = await Product.find({
      categoryId: product.categoryId?._id,
      _id: { $ne: product._id },
      isActive: true
    }).limit(4).lean();

    res.render('products/show', {
      title: `${product.name} - Flipkart`,
      product,
      reviews,
      canReview,
      inWishlist,
      similarProducts,
      formatPrice
    });
  } catch (error) {
    next(error);
  }
};
