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
    const deliveryPass = await bcrypt.hash('Delivery@2026', salt);
    const customerPass = await bcrypt.hash('Customer@12345', salt);

    const admin = await User.create({
      name: 'Shubham Kumar (Admin)',
      email: 'shubhamrai9122@gmail.com',
      passwordHash: adminPass,
      role: 'admin',
      phone: '9876543210',
      isVerified: true,
      isActive: true
    });

    const deliveryAgent = await User.create({
      name: 'Shubham Logistics (Delivery Partner)',
      email: 'shubham.logistics@gmail.com',
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

    console.log('Creating Flipkart categories with high-res verified images...');
    const categories = await Category.insertMany([
      {
        name: 'Mobiles',
        slug: 'mobiles',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&q=80'
      },
      {
        name: 'Electronics',
        slug: 'electronics',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&q=80'
      },
      {
        name: 'Fashion',
        slug: 'fashion',
        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&q=80'
      },
      {
        name: 'Home & Kitchen',
        slug: 'home-kitchen',
        image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=200&q=80'
      },
      {
        name: 'Appliances',
        slug: 'appliances',
        image: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=200&q=80'
      },
      {
        name: 'Groceries',
        slug: 'groceries',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80'
      },
      {
        name: 'Food & Snacks',
        slug: 'food-snacks',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80'
      },
      {
        name: 'Medicines & Health',
        slug: 'medicines-health',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&q=80'
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
        images: ['https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=200&q=80'],
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
        stock: 3,
        ratingAvg: 4.3,
        ratingCount: 420
      },
      // --- Groceries & Daily Staples ---
      {
        name: 'Aashirvaad Superior MP Whole Wheat Atta (5 kg)',
        slug: 'aashirvaad-superior-mp-whole-wheat-atta-5kg',
        description: '100% pure whole wheat grain flour with superior aroma, nutrition, and natural dietary fiber for extra soft rotis.',
        price: 295,
        discountPrice: 265,
        images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80'],
        categoryId: catMap['groceries'],
        brand: 'Aashirvaad',
        stock: 50,
        ratingAvg: 4.7,
        ratingCount: 320
      },
      {
        name: 'Fortune Sunlite Refined Sunflower Oil (1 L Pouch)',
        slug: 'fortune-sunlite-refined-sunflower-oil-1l',
        description: 'Light, healthy and easily digestible sunflower cooking oil fortified with Vitamins A & D.',
        price: 165,
        discountPrice: 138,
        images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80'],
        categoryId: catMap['groceries'],
        brand: 'Fortune',
        stock: 45,
        ratingAvg: 4.6,
        ratingCount: 210
      },
      {
        name: 'India Gate Super Basmati Rice (5 kg)',
        slug: 'india-gate-super-basmati-rice-5kg',
        description: 'Aged long-grain aromatic Basmati rice ideal for everyday pulao, biryani, and special family dining.',
        price: 575,
        discountPrice: 449,
        images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80'],
        categoryId: catMap['groceries'],
        brand: 'India Gate',
        stock: 35,
        ratingAvg: 4.8,
        ratingCount: 415
      },
      {
        name: 'Tata Salt Vacuum Evaporated Iodised Salt (1 kg)',
        slug: 'tata-salt-vacuum-evaporated-iodised-salt-1kg',
        description: 'India’s trusted national salt brand with guaranteed iodine purity and vacuum evaporation technology.',
        price: 30,
        discountPrice: 26,
        images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80'],
        categoryId: catMap['groceries'],
        brand: 'Tata Salt',
        stock: 120,
        ratingAvg: 4.9,
        ratingCount: 950
      },
      {
        name: 'Amul Pure Cow Ghee (1 L Tin)',
        slug: 'amul-pure-cow-ghee-1l-tin',
        description: 'Traditional granular golden cow ghee with rich natural aroma and authentic desi taste.',
        price: 680,
        discountPrice: 620,
        images: ['https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=600&q=80'],
        categoryId: catMap['groceries'],
        brand: 'Amul',
        stock: 28,
        ratingAvg: 4.8,
        ratingCount: 340
      },
      {
        name: 'Tata Sampann Unpolished Toor Dal (1 kg)',
        slug: 'tata-sampann-unpolished-toor-dal-1kg',
        description: 'Unpolished protein-rich arhar dal packed without artificial coloring or water polishing.',
        price: 199,
        discountPrice: 175,
        images: ['https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&q=80'],
        categoryId: catMap['groceries'],
        brand: 'Tata Sampann',
        stock: 60,
        ratingAvg: 4.6,
        ratingCount: 180
      },
      // --- Food & Snacks ---
      {
        name: 'Amul Taaza Homogenised Toned Milk (1 L Tetra Pak)',
        slug: 'amul-taaza-homogenised-toned-milk-1l',
        description: 'UHT treated fresh milk with zero preservatives, ready to drink straight from the pack with no boiling needed.',
        price: 78,
        discountPrice: 72,
        images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80'],
        categoryId: catMap['food-snacks'],
        brand: 'Amul',
        stock: 80,
        ratingAvg: 4.8,
        ratingCount: 520
      },
      {
        name: 'Britannia 100% Whole Wheat Bread (400 g)',
        slug: 'britannia-100-percent-whole-wheat-bread-400g',
        description: 'Soft and healthy morning breakfast bread baked with 100% whole wheat grains and zero added maida.',
        price: 50,
        discountPrice: 45,
        images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80'],
        categoryId: catMap['food-snacks'],
        brand: 'Britannia',
        stock: 65,
        ratingAvg: 4.5,
        ratingCount: 290
      },
      {
        name: 'Farm Fresh Grade-A White Eggs (Pack of 12)',
        slug: 'farm-fresh-grade-a-white-eggs-12-pack',
        description: 'Clean, sanitized, and farm-fresh poultry eggs with high protein content and golden yolks.',
        price: 115,
        discountPrice: 95,
        images: ['https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=600&q=80'],
        categoryId: catMap['food-snacks'],
        brand: 'Farm Fresh',
        stock: 40,
        ratingAvg: 4.7,
        ratingCount: 380
      },
      {
        name: 'Maggi 2-Minute Masala Instant Noodles (Pack of 12)',
        slug: 'maggi-2-minute-masala-instant-noodles-12-pack',
        description: 'Classic favorite noodle pack with signature roast spice blend and goodness of iron in every bite.',
        price: 175,
        discountPrice: 158,
        images: ['https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&q=80'],
        categoryId: catMap['food-snacks'],
        brand: 'Maggi',
        stock: 90,
        ratingAvg: 4.9,
        ratingCount: 1120
      },
      {
        name: 'Lay\'s India\'s Magic Masala Potato Chips (115 g Party Pack)',
        slug: 'lays-indias-magic-masala-chips-115g',
        description: 'Crispy sliced Indian potatoes flavored with zesty red chili and authentic street chaat spices.',
        price: 55,
        discountPrice: 48,
        images: ['https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&q=80'],
        categoryId: catMap['food-snacks'],
        brand: 'Lay\'s',
        stock: 110,
        ratingAvg: 4.6,
        ratingCount: 670
      },
      {
        name: 'Cadbury Dairy Milk Silk Chocolate Bar (150 g)',
        slug: 'cadbury-dairy-milk-silk-chocolate-bar-150g',
        description: 'Silky smooth, creamy milk chocolate bar crafted to melt in your mouth with unforgettable sweetness.',
        price: 190,
        discountPrice: 165,
        images: ['https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&q=80'],
        categoryId: catMap['food-snacks'],
        brand: 'Cadbury',
        stock: 55,
        ratingAvg: 4.9,
        ratingCount: 830
      },
      // --- Medicines & Healthcare ---
      {
        name: 'Dolo 650 mg Paracetamol Tablets (Strip of 15)',
        slug: 'dolo-650mg-paracetamol-tablets-15-pack',
        description: 'Fast-acting anti-pyretic and pain reliever tablet for rapid fever reduction, headaches, and muscle aches.',
        price: 36,
        discountPrice: 32,
        images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80'],
        categoryId: catMap['medicines-health'],
        brand: 'Micro Labs',
        stock: 100,
        ratingAvg: 4.9,
        ratingCount: 780
      },
      {
        name: 'Vicks VapoRub Fast Relief Cold & Cough Balm (50 ml)',
        slug: 'vicks-vaporub-fast-relief-cold-cough-balm-50ml',
        description: 'Natural menthol, camphor, and eucalyptus oil vaporizing ointment to clear blocked noses and ease coughs.',
        price: 160,
        discountPrice: 145,
        images: ['https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&q=80'],
        categoryId: catMap['medicines-health'],
        brand: 'Vicks',
        stock: 75,
        ratingAvg: 4.8,
        ratingCount: 610
      },
      {
        name: 'Crocin Advance Fast Pain Relief Tablets (Strip of 20)',
        slug: 'crocin-advance-fast-pain-relief-20-pack',
        description: 'Optizorb technology paracetamol release for fast absorption and headache relief within minutes.',
        price: 55,
        discountPrice: 48,
        images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80'],
        categoryId: catMap['medicines-health'],
        brand: 'GSK',
        stock: 85,
        ratingAvg: 4.8,
        ratingCount: 490
      },
      {
        name: 'Dettol Antiseptic Liquid Disinfectant (550 ml)',
        slug: 'dettol-antiseptic-liquid-disinfectant-550ml',
        description: 'Proven first-aid antiseptic liquid for cuts, bites, stings, hygiene bathing, and surface disinfection.',
        price: 245,
        discountPrice: 215,
        images: ['https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80'],
        categoryId: catMap['medicines-health'],
        brand: 'Dettol',
        stock: 50,
        ratingAvg: 4.9,
        ratingCount: 890
      },
      {
        name: 'Hansaplast Waterproof First Aid Bandages (Pack of 20)',
        slug: 'hansaplast-waterproof-first-aid-bandages-20-pack',
        description: 'Sterile waterproof adhesive wound plaster strips that protect against dirt and bacteria during healing.',
        price: 75,
        discountPrice: 65,
        images: ['https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&q=80'],
        categoryId: catMap['medicines-health'],
        brand: 'Hansaplast',
        stock: 120,
        ratingAvg: 4.7,
        ratingCount: 340
      },
      {
        name: 'Limcee 500 mg Vitamin C Chewable Tablets (Strip of 15)',
        slug: 'limcee-500mg-vitamin-c-chewable-tablets-15-pack',
        description: 'Immunity booster chewable ascorbic acid tablets in delicious tangy orange flavor.',
        price: 32,
        discountPrice: 28,
        images: ['https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&q=80'],
        categoryId: catMap['medicines-health'],
        brand: 'Abbott',
        stock: 150,
        ratingAvg: 4.9,
        ratingCount: 920
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
    const activeOrder = await Order.create({
      userId: customer._id,
      orderNumber: 'OD8392019482',
      items: [
        {
          productId: products[3]._id,
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
      createdAt: new Date(Date.now() - 36 * 3600 * 1000),
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
          message: 'Courier partner is out for delivery.',
          timestamp: new Date(Date.now() - 2 * 3600 * 1000),
          updatedBy: deliveryAgent._id
        }
      ]
    });

    // Additional realistic delivered orders across daily and weekly buckets for sales trend analytics
    const pastOrders = [
      {
        orderNumber: 'OD9182736450',
        prod: products[0], // iPhone 15 Pro Max
        qty: 1,
        daysAgo: 1,
        status: 'Delivered',
        payStatus: 'completed',
        payMethod: 'Mock_UPI'
      },
      {
        orderNumber: 'OD8273645192',
        prod: products[1], // Samsung S24 Ultra
        qty: 1,
        daysAgo: 2,
        status: 'Delivered',
        payStatus: 'completed',
        payMethod: 'Mock_Card'
      },
      {
        orderNumber: 'OD7364519283',
        prod: products[4], // Dell XPS 15
        qty: 1,
        daysAgo: 4,
        status: 'Delivered',
        payStatus: 'completed',
        payMethod: 'Mock_UPI'
      },
      {
        orderNumber: 'OD6451928374',
        prod: products[2], // MacBook Air M3
        qty: 1,
        daysAgo: 8,
        status: 'Delivered',
        payStatus: 'completed',
        payMethod: 'Mock_Card'
      },
      {
        orderNumber: 'OD5192837465',
        prod: products[3], // Sony Headphones
        qty: 2,
        daysAgo: 15,
        status: 'Delivered',
        payStatus: 'completed',
        payMethod: 'COD'
      },
      {
        orderNumber: 'OD4283746519',
        prod: products[5], // Nike Air Force
        qty: 1,
        daysAgo: 22,
        status: 'Delivered',
        payStatus: 'completed',
        payMethod: 'Mock_Card'
      }
    ];

    for (const po of pastOrders) {
      const pPrice = po.prod.discountPrice || po.prod.price;
      const oDate = new Date(Date.now() - po.daysAgo * 24 * 3600 * 1000);
      await Order.create({
        userId: customer._id,
        orderNumber: po.orderNumber,
        items: [
          {
            productId: po.prod._id,
            name: po.prod.name,
            image: po.prod.images[0],
            price: po.prod.price,
            discountPrice: po.prod.discountPrice,
            quantity: po.qty,
            subtotal: pPrice * po.qty
          }
        ],
        totals: {
          subtotal: po.prod.price * po.qty,
          shipping: 0,
          discount: (po.prod.price - pPrice) * po.qty,
          grandTotal: pPrice * po.qty
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
        paymentMethod: po.payMethod,
        paymentStatus: po.payStatus,
        orderStatus: po.status,
        deliveryAgentId: deliveryAgent._id,
        createdAt: oDate,
        updatedAt: oDate
      });
    }

    console.log('Creating sample verified review...');
    await Review.create({
      userId: customer._id,
      productId: products[5]._id,
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
        email: 'unknown@visitor.com',
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

    console.log('🎉 Seeding finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
