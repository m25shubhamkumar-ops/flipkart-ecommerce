require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/user.model');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
const Cart = require('../models/cart.model');
const Wishlist = require('../models/wishlist.model');
const Address = require('../models/address.model');
const Order = require('../models/order.model');
const Review = require('../models/review.model');
const LoginActivity = require('../models/loginActivity.model');
const OtpToken = require('../models/otp.model');

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/flipkart_db';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing old collections...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Cart.deleteMany({}),
      Wishlist.deleteMany({}),
      Address.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({}),
      LoginActivity.deleteMany({}),
      OtpToken.deleteMany({})
    ]);

    console.log('Creating demo users with distinct roles...');
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('Admin@12345', salt);
    const deliveryPass = await bcrypt.hash('Delivery@12345', salt);
    const customerPass = await bcrypt.hash('Customer@12345', salt);

    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@flipkart.com',
      passwordHash: adminPass,
      role: 'admin',
      phone: '9876543210',
      isVerified: true,
      isActive: true
    });

    const deliveryAgent = await User.create({
      name: 'Ramesh (Logistics Partner)',
      email: 'delivery@flipkart.com',
      passwordHash: deliveryPass,
      role: 'delivery',
      phone: '9876543211',
      isVerified: true,
      isActive: true
    });

    const customer = await User.create({
      name: 'Rahul Sharma',
      email: 'customer@flipkart.com',
      passwordHash: customerPass,
      role: 'customer',
      phone: '9876543212',
      isVerified: true,
      isActive: true
    });

    console.log('Creating Flipkart categories...');
    const categories = await Category.insertMany([
      {
        name: 'Mobiles',
        slug: 'mobiles',
        image: 'https://rukminim2.flixcart.com/flap/128/128/image/22fdd04723182f4f.png?q=100'
      },
      {
        name: 'Electronics',
        slug: 'electronics',
        image: 'https://rukminim2.flixcart.com/flap/128/128/image/69c6589653afdb9a.png?q=100'
      },
      {
        name: 'Fashion',
        slug: 'fashion',
        image: 'https://rukminim2.flixcart.com/fk-p-flap/128/128/image/0d75b34f7d7f0db3.png?q=100'
      },
      {
        name: 'Home & Kitchen',
        slug: 'home-kitchen',
        image: 'https://rukminim2.flixcart.com/flap/128/128/image/ab7e2b022a4587dd.jpg?q=100'
      },
      {
        name: 'Appliances',
        slug: 'appliances',
        image: 'https://rukminim2.flixcart.com/flap/128/128/image/0ff199d1bd27eb98.png?q=100'
      }
    ]);

    const catMap = {};
    categories.forEach(c => { catMap[c.slug] = c._id; });

    console.log('Creating products catalog with pricing and stock...');
    const products = await Product.insertMany([
      {
        name: 'Apple iPhone 15 Pro Max (256 GB) - Blue Titanium',
        slug: 'apple-iphone-15-pro-max-256gb-blue-titanium',
        description: 'Titanium design with A17 Pro Chip, 48MP main camera system with 5x telephoto optical zoom, Action button, USB-C connector with USB 3 speeds.',
        price: 159900,
        discountPrice: 148900,
        images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80'],
        categoryId: catMap['mobiles'],
        brand: 'Apple',
        stock: 24,
        ratingAvg: 4.8,
        ratingCount: 142
      },
      {
        name: 'Samsung Galaxy S24 Ultra 5G (Titanium Gray, 256 GB)',
        slug: 'samsung-galaxy-s24-ultra-5g-titanium-gray',
        description: 'Meet Galaxy S24 Ultra, the ultimate form of Galaxy Ultra with a new titanium exterior and a 17.25cm flat display. Galaxy AI is here.',
        price: 134999,
        discountPrice: 119999,
        images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80'],
        categoryId: catMap['mobiles'],
        brand: 'Samsung',
        stock: 18,
        ratingAvg: 4.7,
        ratingCount: 89
      },
      {
        name: 'Apple MacBook Air M3 Chip (16 GB / 512 GB SSD) - Midnight',
        slug: 'apple-macbook-air-m3-16gb-512gb-midnight',
        description: 'Strikingly thin and fast MacBook Air with M3 chip, up to 18 hours battery life, 13.6-inch Liquid Retina Display, 1080p FaceTime HD camera.',
        price: 134900,
        discountPrice: 124900,
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80'],
        categoryId: catMap['electronics'],
        brand: 'Apple',
        stock: 12,
        ratingAvg: 4.9,
        ratingCount: 56
      },
      {
        name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
        slug: 'sony-wh-1000xm5-wireless-headphones',
        description: 'Industry-leading noise cancellation with two processors and 8 microphones. Exceptional sound quality and crystal clear hands-free calling.',
        price: 34990,
        discountPrice: 26990,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80'],
        categoryId: catMap['electronics'],
        brand: 'Sony',
        stock: 35,
        ratingAvg: 4.6,
        ratingCount: 230
      },
      {
        name: 'Dell XPS 15 9530 Core i7 13th Gen OLED Laptop',
        slug: 'dell-xps-15-9530-core-i7-oled',
        description: 'Stunning 3.5K OLED touchscreen, 13th Gen Intel Core i7-13700H, 32GB RAM, 1TB SSD, NVIDIA GeForce RTX 4060 graphics.',
        price: 199990,
        discountPrice: 179990,
        images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80'],
        categoryId: catMap['electronics'],
        brand: 'Dell',
        stock: 6,
        ratingAvg: 4.5,
        ratingCount: 38
      },
      {
        name: "Nike Air Force 1 '07 Classic Men's Sneakers",
        slug: 'nike-air-force-1-07-classic-sneakers',
        description: 'The radiance lives on in the Nike Air Force 1 07, the b-ball icon that puts a fresh spin on crisp leather, bold details and heritage style.',
        price: 8995,
        discountPrice: 7495,
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'],
        categoryId: catMap['fashion'],
        brand: 'Nike',
        stock: 45,
        ratingAvg: 4.7,
        ratingCount: 310
      },
      {
        name: 'Dyson V12 Detect Slim Cordless Vacuum Cleaner',
        slug: 'dyson-v12-detect-slim-cordless-vacuum',
        description: 'Dyson most compact intelligent cordless vacuum. Laser reveals microscopic dust, Piezo sensor continuously sizes and counts dust particles.',
        price: 55900,
        discountPrice: 42900,
        images: ['https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&q=80'],
        categoryId: catMap['home-kitchen'],
        brand: 'Dyson',
        stock: 14,
        ratingAvg: 4.8,
        ratingCount: 75
      },
      {
        name: 'LG 55 inch 4K Ultra HD Smart OLED TV (OLED55C3)',
        slug: 'lg-55-inch-4k-ultra-hd-smart-oled-tv',
        description: 'Self-lit OLED pixels with infinite contrast, α9 AI Processor 4K Gen6, Brightness Booster, Dolby Vision & Atmos, webOS 23.',
        price: 169990,
        discountPrice: 114990,
        images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&q=80'],
        categoryId: catMap['appliances'],
        brand: 'LG',
        stock: 8,
        ratingAvg: 4.7,
        ratingCount: 62
      },
      {
        name: 'Philips Digital Air Fryer HD9252 with Rapid Air',
        slug: 'philips-digital-air-fryer-hd9252',
        description: 'Healthy frying with Rapid Air technology. 7 preset touch screen menus, keep warm function, dishwasher safe parts.',
        price: 11995,
        discountPrice: 7999,
        images: ['https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=600&q=80'],
        categoryId: catMap['home-kitchen'],
        brand: 'Philips',
        stock: 40,
        ratingAvg: 4.5,
        ratingCount: 195
      },
      {
        name: 'Noise ColorFit Pro 5 Smartwatch with AMOLED Display',
        slug: 'noise-colorfit-pro-5-smartwatch-amoled',
        description: '1.96" AMOLED display, Bluetooth calling with Tru Sync, 100+ sports modes, 24/7 heart rate and SpO2 tracking, IP68 water resistant.',
        price: 7999,
        discountPrice: 2799,
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'],
        categoryId: catMap['electronics'],
        brand: 'Noise',
        stock: 3, // Low stock demo!
        ratingAvg: 4.3,
        ratingCount: 420
      }
    ]);

    console.log('Creating customer address...');
    const address = await Address.create({
      userId: customer._id,
      fullName: 'Rahul Sharma',
      phone: '9876543212',
      line1: 'Flat 402, Sunshine Apartments, 12th Main Road',
      line2: 'Near Indiranagar Metro Station',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      country: 'India',
      isDefault: true
    });

    console.log('Creating sample orders for customer and assigning to delivery agent...');
    
    // Order 1: Active In-Transit order assigned to Ramesh
    const activeOrder = await Order.create({
      userId: customer._id,
      orderNumber: 'OD8392019482',
      items: [
        {
          productId: products[3]._id, // Sony Headphones
          name: products[3].name,
          image: products[3].images[0],
          price: products[3].price,
          discountPrice: products[3].discountPrice,
          quantity: 1,
          subtotal: products[3].discountPrice
        }
      ],
      totals: {
        subtotal: products[3].price,
        shipping: 0,
        discount: products[3].price - products[3].discountPrice,
        grandTotal: products[3].discountPrice
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
      paymentMethod: 'COD',
      paymentStatus: 'pending',
      orderStatus: 'Out for Delivery',
      deliveryAgentId: deliveryAgent._id,
      deliveryNotes: 'Dispatched from Bangalore central sorting facility',
      statusTimeline: [
        {
          status: 'Placed',
          message: 'Order received and confirmed by Flipkart.',
          timestamp: new Date(Date.now() - 36 * 3600 * 1000),
          updatedBy: customer._id
        },
        {
          status: 'Confirmed',
          message: 'Order verified and assigned to courier.',
          timestamp: new Date(Date.now() - 24 * 3600 * 1000),
          updatedBy: admin._id
        },
        {
          status: 'Packed',
          message: 'Package packed and bubble wrapped at warehouse.',
          timestamp: new Date(Date.now() - 12 * 3600 * 1000),
          updatedBy: admin._id
        },
        {
          status: 'Out for Delivery',
          message: 'Courier partner Ramesh is out for delivery.',
          timestamp: new Date(Date.now() - 2 * 3600 * 1000),
          updatedBy: deliveryAgent._id
        }
      ]
    });

    // Order 2: Delivered order with completed review
    const deliveredOrder = await Order.create({
      userId: customer._id,
      orderNumber: 'OD1948274021',
      items: [
        {
          productId: products[5]._id, // Nike Air Force 1
          name: products[5].name,
          image: products[5].images[0],
          price: products[5].price,
          discountPrice: products[5].discountPrice,
          quantity: 1,
          subtotal: products[5].discountPrice
        }
      ],
      totals: {
        subtotal: products[5].price,
        shipping: 0,
        discount: products[5].price - products[5].discountPrice,
        grandTotal: products[5].discountPrice
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
      paymentMethod: 'Mock_Card',
      paymentStatus: 'completed',
      orderStatus: 'Delivered',
      deliveryAgentId: deliveryAgent._id,
      deliveryNotes: 'Delivered to customer directly. Received 5-star rating.',
      statusTimeline: [
        {
          status: 'Placed',
          message: 'Order received.',
          timestamp: new Date(Date.now() - 72 * 3600 * 1000),
          updatedBy: customer._id
        },
        {
          status: 'Delivered',
          message: 'Package handed to recipient.',
          timestamp: new Date(Date.now() - 48 * 3600 * 1000),
          updatedBy: deliveryAgent._id
        }
      ]
    });

    console.log('Creating sample verified review...');
    await Review.create({
      userId: customer._id,
      productId: products[5]._id,
      orderId: deliveredOrder._id,
      rating: 5,
      title: 'Super comfortable sneakers!',
      comment: 'Authentic Nike sneakers delivered in great packaging. Fits true to size and looks classic.',
      isVerifiedPurchase: true
    });

    console.log('Creating sample LoginActivity audit trail records...');
    await LoginActivity.insertMany([
      {
        userId: admin._id,
        email: admin.email,
        loginTime: new Date(Date.now() - 3600 * 1000),
        logoutTime: null,
        status: 'success',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
        device: 'Desktop',
        browser: 'Chrome 122.0.0',
        operatingSystem: 'macOS 10.15.7',
        authenticationMethod: 'password'
      },
      {
        userId: deliveryAgent._id,
        email: deliveryAgent.email,
        loginTime: new Date(Date.now() - 2 * 3600 * 1000),
        logoutTime: new Date(Date.now() - 30 * 60 * 1000),
        status: 'success',
        ipAddress: '192.168.1.45',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
        device: 'iPhone',
        browser: 'Mobile Safari 17.3',
        operatingSystem: 'iOS 17.3',
        authenticationMethod: 'password'
      },
      {
        userId: null,
        email: 'intruder@unknown.com',
        loginTime: new Date(Date.now() - 4 * 3600 * 1000),
        logoutTime: null,
        status: 'failed',
        failureReason: 'User not found',
        ipAddress: '203.0.113.195',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        device: 'Desktop',
        browser: 'Chrome 120.0.0',
        operatingSystem: 'Windows 10',
        authenticationMethod: 'password'
      }
    ]);

    console.log('\n=============================================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=============================================================');
    console.log('Demo Credentials for the 3 Roles:');
    console.log('1. 🛒 Customer:');
    console.log('   Email:    customer@flipkart.com');
    console.log('   Password: Customer@12345');
    console.log('2. 🚚 Delivery Agent:');
    console.log('   Email:    delivery@flipkart.com');
    console.log('   Password: Delivery@12345');
    console.log('3. 👑 Admin:');
    console.log('   Email:    admin@flipkart.com');
    console.log('   Password: Admin@12345');
    console.log('=============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
