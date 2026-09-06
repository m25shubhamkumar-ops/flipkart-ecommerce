# Flipkart-Style E-Commerce Platform

A production-ready full-stack e-commerce marketplace built strictly following the complete student project roadmap with server-side rendering (SSR), secure authentication, order lifecycle management, and a three-tier Role-Based Access Control (RBAC) architecture for **Customer**, **Delivery Agent**, and **Admin**.

> 📖 **Comprehensive Architectural & Learning Guide**:
> For an exhaustive, deep-dive breakdown of how this entire platform works under the hood (including system architecture diagrams, request lifecycle, Mongoose schemas, 5-stage reverse logistics/returns engine, smart Indian address system, BFCache resilience, and design interview concepts), see the dedicated **[PROJECT_LEARNING_GUIDE.md](PROJECT_LEARNING_GUIDE.md)**.

---

## Architecture Overview

```
                      +-----------------------------+
                      |         Web Browser         |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |   Express.js Route Engine   |
                      +--------------+--------------+
                                     |
                 +-------------------+-------------------+
                 |                   |                   |
                 v                   v                   v
     +---------------------+ +-----------------+ +--------------------+
     |   Customer Routes   | | Delivery Routes | |    Admin Routes    |
     |  (/, /cart, /orders)| |   (/delivery/*) | |     (/admin/*)     |
     +----------+----------+ +--------+--------+ +---------+----------+
                |                     |                    |
                +---------------------+--------------------+
                                     |
                                     v
                      +-----------------------------+
                      | Middleware (Auth, RBAC, etc)|
                      +--------------+--------------+
                                     |
                      +--------------v--------------+
                      |   Controllers & Services    |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |   Mongoose Models & Mongo   |
                      +-----------------------------+
```

---

## 3 Dedicated User Roles & Access Matrix

| Feature / Area | 🛒 Customer | 🚚 Delivery Agent | 👑 Admin |
| :--- | :---: | :---: | :---: |
| Browse Catalog, Categories & Search | ✅ | ✅ | ✅ |
| Shopping Cart & Wishlist | ✅ | ❌ | ❌ |
| Checkout & Order Placement | ✅ | ❌ | ❌ |
| My Orders & Live Tracking Timeline | ✅ | ❌ | ❌ |
| 5-Stage Order Returns & Refunds | ✅ | ❌ | ❌ |
| Write Verified Reviews & Ratings | ✅ | ❌ | ❌ |
| Dedicated Delivery Portal (`/delivery`) | ❌ | ✅ | ❌ |
| 1-Click Google Maps GPS Navigation | ❌ | ✅ | ❌ |
| Update Delivery Status & Return Pickups | ❌ | ✅ | ❌ |
| Collect Cash on Delivery (COD) Payments | ❌ | ✅ | ❌ |
| Full Master Admin Panel (`/admin`) | ❌ | ❌ | ✅ |
| Product Catalog CRUD & Inventory Control | ❌ | ❌ | ✅ |
| Category Management | ❌ | ❌ | ✅ |
| Assign Orders to Delivery Agents | ❌ | ❌ | ✅ |
| User Directory & Credentials Audit | ❌ | ❌ | ✅ |
| **Login Activity / Security Audit Trail** | ❌ | ❌ | ✅ |

---

## Technology Stack

- **Frontend / SSR**: HTML5, EJS, Tailwind CSS, FontAwesome 6, Vanilla JavaScript
- **Backend**: Node.js + Express.js
- **Database**: MongoDB & Mongoose (with automated indexes & TTL expiry)
- **Authentication**: bcrypt password hashing (10 rounds), JWT in secure HTTP-only cookies, 6-digit OTP verification & password reset
- **Audit & Observability**: Detailed Login Activity capturing IP address, user-agent, device, browser, operating system, and login/logout times
- **Address & Geo Services**: India Post live Postal PIN code validation API (`api.postalpincode.in`) & Google Maps universal GPS routing

---

## Verified Master Credentials

The platform enforces strict security separation (public demo login buttons have been removed from the login screen for production security):

| Role | Email Address | Password | Landing Page |
| :--- | :--- | :--- | :--- |
| **👑 Master Admin** | `shubhamrai9122@gmail.com` | `Admin@12345` | `/admin/dashboard` |
| **🚚 Delivery Agent** | `shubham.logistics@gmail.com` | `Delivery@2026` | `/delivery/dashboard` |
| **🛒 Customer Account** | Self-registered or seeded | User configured | `/` (Marketplace) |

---

## Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/m25shubhamkumar-ops/flipkart-ecommerce.git
cd flipkart-ecommerce

# Install dependencies
npm install
```

### 3. Environment Configuration
Ensure your `.env` contains:
```ini
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/flipkart_db
JWT_SECRET=your_ultra_secure_jwt_secret_token_key_here
EMAIL_USER=support@flipkart-demo.com
EMAIL_PASSWORD=test_smtp_pass
```

### 4. Database Seeding
Populate categories, realistic Flipkart products, accounts, sample orders, and audit trail logs:
```bash
npm run seed
```

### 5. Running the Application
```bash
# Start the web server
npm start

# Or with live reloading:
npm run dev
```
Open your browser at **`http://localhost:3000`**.

### 6. Running Automated Tests
```bash
npm test
```

---

## Key Modules & Features Implemented

1. **Authentication, OTP & Smart Navigation**
   - Registration with password confirmation, bcrypt hashing, and 6-digit OTP verification.
   - Login issuing a signed JWT in an HTTP-only cookie.
   - **Smart Unregistered-Email Redirection**: Automatically detects when an unregistered user attempts to log in and redirects them to the registration tab with their email prefilled.
   - Logout updating the `logoutTime` in the audit record.
   - Forgot-password flow with OTP verification and bcrypt reset.

2. **Login Activity / Audit Trail & Security Inspector**
   - Every login attempt (success or failure) is logged to MongoDB.
   - Captures User ID, email, timestamp, IP address, user-agent, device (Desktop/Mobile), browser, and OS.
   - Admin view at `/admin/login-activity` with search by email, filter by success/failure, and pagination.
   - Admin credentials viewer at `/admin/users` displaying authentication status and password hashing metadata.

3. **Catalog, Search & Real-Time Stock Indicators**
   - Flipkart top categories strip with category icons.
   - Product listing with search bar, category filter, brand filter, price range slider, sort dropdown (Newest, Price Low-High, Price High-Low, Rating), and pagination.
   - Detailed product view with image gallery, discount calculations, stock indicators (`In Stock`, `Low Stock`, `Out of Stock`), and customer reviews.

4. **Cart, Wishlist & BFCache Resiliency**
   - Server-side price recalculation (never trusts client totals).
   - Quantity adjustment with real-time stock bounds.
   - BFCache (`pageshow`) synchronization ensuring cart counters never display stale values on browser back/forward navigation.

5. **Smart Indian Address Assistant & PIN Code Engine**
   - Complete dictionary of all 36 Indian States and Union Territories.
   - Live India Post PIN code validation (`api.postalpincode.in`) auto-populating city, district, and state upon typing a 6-digit PIN code.
   - Hybrid city input combining an autocomplete datalist of major cities with full manual entry for tier-2/3 towns and villages.

6. **Orders & Atomic Inventory Concurrency**
   - Orders capture full immutable snapshots of products and delivery addresses at time of checkout.
   - Atomic inventory reduction (`$inc: { stock: -quantity }`).
   - Visual step-by-step progress tracker: `Placed` -> `Confirmed` -> `Packed` -> `Shipped` -> `Out for Delivery` -> `Delivered`.
   - Customer can cancel orders prior to shipment, which automatically restores inventory.

7. **5-Stage Reverse Logistics (Returns & Refunds Engine)**
   - Complete return pipeline:
     1. `Return Requested`: Customer specifies reason and comments.
     2. `Return Confirmed`: Admin approves return request.
     3. `Out for Return Pickup`: Assigned to delivery courier partner.
     4. `Item Picked Up`: Courier verifies package condition at customer doorstep.
     5. `Refund Processed`: Inventory replenished and refund settled.
   - Self-service `Return Cancelled` option for customers before pickup.

8. **Delivery Agent Portal & GPS Doorstep Routing (`/delivery`)**
   - Dedicated portal for courier partners with separate queues for Deliveries and Return Pickups.
   - 1-Click Google Maps GPS navigation link directing courier to the exact customer doorstep.
   - Delivery agent can mark shipment as `Out for Delivery` or `Delivered`, automatically settling COD payments.

9. **Admin Control Center (`/admin`)**
   - Executive KPI metrics: Total revenue, total orders, customers count, delivery agents count, and low stock warnings.
   - Product CRUD (Create, Read, Update, Delete) with image URLs and inventory tracking.
   - Master order queue with the ability to assign orders to delivery agents.
   - Master return & reverse logistics resolution queue.

---

## Cloud Deployment

- **Live URL**: [https://flipkart-ecommerce-wql5.onrender.com](https://flipkart-ecommerce-wql5.onrender.com)
- **GitHub Repository**: [https://github.com/m25shubhamkumar-ops/flipkart-ecommerce](https://github.com/m25shubhamkumar-ops/flipkart-ecommerce)
- **Database**: MongoDB Atlas High-Availability Cluster
- **Hosting Platform**: Render Cloud Web Service with automated continuous deployment
