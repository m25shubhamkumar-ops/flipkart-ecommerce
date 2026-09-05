# Flipkart-Style E-Commerce Platform

A production-ready full-stack e-commerce marketplace built strictly following the complete student project roadmap with server-side rendering (SSR), secure authentication, order lifecycle management, and a three-tier Role-Based Access Control (RBAC) architecture for **Customer**, **Delivery Agent**, and **Admin**.

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
| Write Verified Reviews & Ratings | ✅ | ❌ | ❌ |
| Dedicated Delivery Portal (`/delivery`) | ❌ | ✅ | ❌ |
| Update Delivery Status (`Out for Delivery` / `Delivered`) | ❌ | ✅ | ❌ |
| Collect Cash on Delivery (COD) Payments | ❌ | ✅ | ❌ |
| Full Master Admin Panel (`/admin`) | ❌ | ❌ | ✅ |
| Product Catalog CRUD & Inventory Control | ❌ | ❌ | ✅ |
| Category Management | ❌ | ❌ | ✅ |
| Assign Orders to Delivery Agents | ❌ | ❌ | ✅ |
| User Directory & Role Promotion | ❌ | ❌ | ✅ |
| **Login Activity / Security Audit Trail** | ❌ | ❌ | ✅ |

---

## Technology Stack

- **Frontend / SSR**: HTML5, EJS, Tailwind CSS, FontAwesome 6, Vanilla JavaScript
- **Backend**: Node.js + Express.js
- **Database**: MongoDB & Mongoose (with automated indexes & TTL expiry)
- **Authentication**: bcrypt password hashing, JWT in secure HTTP-only cookie, 6-digit OTP verification & password reset
- **Audit & Observability**: Detailed Login Activity capturing IP address, user-agent, device, browser, operating system, and login/logout times

---

## Ready-to-Use Demo Credentials

The database seeder pre-configures accounts for each role:

| Role | Email Address | Password | Landing Page |
| :--- | :--- | :--- | :--- |
| **👑 Admin** | `admin@flipkart.com` | `Admin@12345` | `/admin/dashboard` |
| **🚚 Delivery Agent** | `delivery@flipkart.com` | `Delivery@12345` | `/delivery/dashboard` |
| **🛒 Customer** | `customer@flipkart.com` | `Customer@12345` | `/` (Marketplace) |

*(Quick 1-click credential buttons are also available directly on the login page!)*

---

## Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI

### 2. Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd flipkart-ecommerce

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```ini
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/flipkart_db
JWT_SECRET=flipkart_ultra_secure_jwt_secret_token_key_987654321
EMAIL_USER=support@flipkart-demo.com
EMAIL_PASSWORD=test_smtp_pass
```

### 4. Database Seeding
Populate categories, realistic Flipkart products, demo accounts, sample orders, and audit trail logs:
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

1. **Authentication & Security Plan (PDF Section 4)**
   - Registration with password confirmation, bcrypt hashing, and 6-digit OTP verification.
   - Login issuing a signed JWT in an HTTP-only cookie.
   - Logout updating the `logoutTime` in the audit record.
   - Forgot-password flow with OTP verification and bcrypt reset.

2. **Login Activity / Audit Trail (PDF Section 5)**
   - Every login attempt (success or failure) is logged to MongoDB.
   - Captures User ID, email, timestamp, IP address, user-agent, device (Desktop/Mobile), browser, and OS.
   - Admin view at `/admin/login-activity` with search by email, filter by success/failure, and pagination.

3. **Catalog & Search (PDF Section 3 & 12)**
   - Flipkart top categories strip with category icons.
   - Product listing with search bar, category filter, brand filter, price range slider, sort dropdown (Newest, Price Low-High, Price High-Low, Rating), and pagination.
   - Detailed product view with image gallery, discount calculations, stock indicators, and customer reviews.

4. **Cart, Wishlist & Addresses (PDF Section 8 & 13)**
   - Server-side price recalculation (never trusts client totals).
   - Quantity adjustment with real-time stock bounds.
   - Address book with default shipping address selection.

5. **Orders & Snapshot Modeling (PDF Section 6 & 8)**
   - Orders capture full snapshots of products and delivery addresses at time of checkout.
   - Atomic inventory reduction (`$inc: { stock: -quantity }`).
   - Visual step-by-step progress tracker: `Placed` -> `Confirmed` -> `Packed` -> `Shipped` -> `Out for Delivery` -> `Delivered`.
   - Customer can cancel orders prior to shipment, which automatically restores inventory.

6. **Delivery Agent Portal (`/delivery`)**
   - Dedicated portal for courier partners.
   - Shows assigned shipments, destination address, customer phone, and COD payment status.
   - Delivery agent can mark shipment as `Out for Delivery` or `Delivered` with notes, automatically settling COD payments.

7. **Admin Control Center (`/admin`)**
   - KPI metrics: Total revenue, total orders, customers count, delivery agents count, and low stock warnings.
   - Product CRUD (Create, Read, Update, Delete) with image URLs and inventory tracking.
   - Master order queue with the ability to assign orders to delivery agents.
   - User management with role upgrade controls.
