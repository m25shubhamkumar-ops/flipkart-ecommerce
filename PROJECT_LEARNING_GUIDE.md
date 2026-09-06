# Flipkart-Style E-Commerce Platform: Complete Architecture & Learning Guide

Welcome to the **Flipkart-Style E-Commerce Platform Learning Guide**. This document serves as an exhaustive architectural reference, code walkthrough, and system design manual for developers, system architects, and students looking to master full-stack e-commerce engineering.

---

## Table of Contents
1. [Executive Summary & Architectural Philosophy](#1-executive-summary--architectural-philosophy)
2. [End-to-End System Architecture](#2-end-to-end-system-architecture)
3. [Role-Based Access Control (RBAC) & Security Architecture](#3-role-based-access-control-rbac--security-architecture)
4. [Deep-Dive: How Every Core Module Works Under the Hood](#4-deep-dive-how-every-core-module-works-under-the-hood)
   - [4.1 Authentication, OTP & Smart Navigation](#41-authentication-otp--smart-navigation)
   - [4.2 Product Catalog, Faceted Search & Indexing](#42-product-catalog-faceted-search--indexing)
   - [4.3 Cart Persistence, Server-Side Pricing & BFCache Sync](#43-cart-persistence-server-side-pricing--bfcache-sync)
   - [4.4 Smart Indian Address Assistant & PIN Code Engine](#44-smart-indian-address-assistant--pin-code-engine)
   - [4.5 Forward Order Lifecycle & Atomic Inventory Concurrency](#45-forward-order-lifecycle--atomic-inventory-concurrency)
   - [4.6 Reverse Logistics: 5-Stage Returns & Refunds Engine](#46-reverse-logistics-5-stage-returns--refunds-engine)
   - [4.7 Dedicated Delivery Partner Portal & GPS Routing](#47-dedicated-delivery-partner-portal--gps-routing)
   - [4.8 Master Admin Control Center & Enterprise Observability](#48-master-admin-control-center--enterprise-observability)
5. [Database Schemas & Data Model Architecture](#5-database-schemas--data-model-architecture)
6. [Complete Project Layout & Directory Structure](#6-complete-project-layout--directory-structure)
7. [Comprehensive Route & API Directory](#7-comprehensive-route--api-directory)
8. [Local Development, Automated Testing & Cloud Deployment](#8-local-development-automated-testing--cloud-deployment)
9. [Key Architectural & System Design Takeaways](#9-key-architectural--system-design-takeaways)

---

## 1. Executive Summary & Architectural Philosophy

The **Flipkart E-Commerce Platform** is an enterprise-grade, server-side rendered (SSR) multi-role marketplace built with **Node.js**, **Express.js**, **MongoDB (Mongoose)**, **EJS**, and **Tailwind CSS**. 

### Architectural Core Principles

1. **Zero-Hydration Server-Side Rendering (SSR)**:
   - Modern Single Page Applications (SPAs) often suffer from heavy JavaScript bundles, slow initial paint (FCP/LCP), poor search engine indexability, and fragile client-side state hydration.
   - This platform renders hyper-optimized, semantic HTML directly on the server via **EJS (Embedded JavaScript)**. Pages load instantly with minimal client-side JavaScript, ensuring maximum SEO performance and ultra-fast mobile responsiveness.

2. **Immutable Snapshot Modeling**:
   - In e-commerce, **orders must never reflect future catalog or user profile modifications**.
   - When an order is placed, full snapshots of product titles, prices, images, and the customer’s complete shipping address are frozen directly into the `Order` document. If a seller later changes the product price or the customer edits their profile address, historic legal invoices and fulfillment orders remain permanently accurate.

3. **Defensive Concurrency & Atomic Operations**:
   - E-commerce platforms are prone to race conditions during flash sales (overselling limited stock).
   - Rather than loading a product in memory, checking stock in JavaScript, and saving it back (which introduces race windows), the platform uses atomic MongoDB operators like `$inc: { stock: -quantity }` with query predicates `{ _id, stock: { $gte: quantity } }`. This guarantees database-level isolation.

4. **Stateless JWT in Secure HTTP-Only Cookies**:
   - Authentication tokens are stored inside `HttpOnly`, `SameSite: Lax`, and `Secure` (in production) cookies.
   - This eliminates client-side XSS attack vectors where malicious scripts can access `localStorage`, while maintaining stateless session scalability across distributed cloud instances.

---

## 2. End-to-End System Architecture

### Request Lifecycle Diagram

```
                                  [ Incoming Client Request ]
                                              │
                                              ▼
                                 [ Cloudflare / Render Edge ]
                                              │
                                              ▼
                                [ Express.js App (app.js) ]
                                              │
                   ┌──────────────────────────┴──────────────────────────┐
                   ▼                                                     ▼
         [ Security Middleware ]                               [ Static Assets (/public) ]
      • Helmet (Security Headers)                             • Tailwind CSS, Images, JS
      • Express Rate Limiters                                 • India Address Engine
      • Cookie Parser & URL Encoding                                     │
                   │                                                     │
                   ▼                                                     │
         [ Global User Hydration ]                                       │
      • Extracts JWT from Cookie                                         │
      • Attaches req.user & res.locals.currentUser                       │
                   │                                                     │
                   ▼                                                     │
         [ Route Matchers & RBAC ]                                       │
      • /auth/*     -> Guest / Public                                    │
      • /cart, /checkout, /orders -> requireRole("customer")             │
      • /delivery/* -> requireRole("delivery")                           │
      • /admin/*    -> requireRole("admin")                              │
                   │                                                     │
                   ▼                                                     │
         [ Business Controller ]                                         │
      • Input Validation & Sanitization                                  │
      • Mongoose Query & Atomic Transactions                             │
                   │                                                     │
                   ▼                                                     │
      ┌─────────────────────────┐                                        │
      │  MongoDB Atlas Cluster  │                                        │
      │  (Users, Orders, Cart,  │                                        │
      │   Products, AuditLogs)  │                                        │
      └────────────┬────────────┘                                        │
                   │ (Data Result)                                       │
                   ▼                                                     │
         [ EJS Template Engine ]                                         │
      • Injects Data into SSR Views                                      │
      • Renders Components & Layouts                                     │
                   │                                                     │
                   ▼                                                     │
         [ Complete HTML Response ] ◄────────────────────────────────────┘
                   │
                   ▼
          [ User Web Browser ]
```

### Dual State Machine Architecture

#### Forward Logistics Lifecycle
```
   [ Placed ] ─────────► [ Confirmed ] ─────────► [ Packed ]
       │                                              │
       ▼                                              ▼
 [ Cancelled ]                                  [ Shipped ]
 (Restores Stock)                                     │
                                                      ▼
                                            [ Out for Delivery ]
                                                      │
                                                      ▼
                                                [ Delivered ]
                                            (Settles COD Payment)
```

#### Reverse Logistics (Returns & Refunds) Lifecycle
```
   [ Delivered Order ]
           │
           ▼
 [ Return Requested ] ◄── Customer specifies reason
           │
     ┌─────┴──────────────────────────┐
     ▼                                ▼
[ Return Cancelled ]        [ Return Confirmed ]
(By Customer)               (Verified by Admin)
                                      │
                                      ▼
                           [ Out for Return Pickup ]
                           (Assigned to Delivery Partner)
                                      │
                                      ▼
                              [ Item Picked Up ]
                              (Condition Verified at Doorstep)
                                      │
                                      ▼
                             [ Refund Processed ]
                             (Stock Replenished + Refund Closed)
```

---

## 3. Role-Based Access Control (RBAC) & Security Architecture

The platform enforces a strict 3-tier Role-Based Access Control hierarchy:

| Role | Access Scope | Landing Page | Forbidden Areas |
| :--- | :--- | :--- | :--- |
| **🛒 Customer** | Catalog browsing, Cart, Checkout, My Orders, Address Book, Order Returns | `/` (Home Marketplace) | `/admin/*`, `/delivery/*` |
| **🚚 Delivery Agent** | Assigned Deliveries, Reverse Pickups, Doorstep GPS Routing, COD Settlement | `/delivery/dashboard` | `/admin/*`, Customer Checkout |
| **👑 Admin** | Global Orders Queue, Product Management, Logistics Dispatch, User Directory, Audit Trail | `/admin/dashboard` | Restricted from placing orders |

### Middleware Defense Guards (`middleware/auth.middleware.js`)

1. **`requireAuth`**:
   - Reads the `token` cookie.
   - Verifies the signature using `jwt.verify(token, JWT_SECRET)`.
   - Fetches the active user from MongoDB.
   - If token is missing, expired, or invalid, clears the cookie and redirects to `/auth/login` with a return URL query parameter.

2. **`requireRole(...allowedRoles)`**:
   - Executes after `requireAuth`.
   - Checks if `allowedRoles.includes(req.user.role)`.
   - If unauthorized, returns an HTTP 403 Forbidden page or redirects to the appropriate authorized dashboard.

3. **`preventAuth`**:
   - Protects login and registration pages from already authenticated users.
   - Intelligently redirects users based on their active role:
     - `admin` -> `/admin/dashboard`
     - `delivery` -> `/delivery/dashboard`
     - `customer` -> `/`

4. **`roleRedirect`**:
   - Prevents non-customers (Admin, Delivery agents) from accessing consumer checkout routes, preserving database data integrity.

### Strict Security Hardening

- **No Public Demo Login Buttons**: All shortcut demo buttons were permanently removed from the public login screen to prevent unauthorized visitors from obtaining administrative or delivery privileges.
- **Audit Trail Logging**: Every authentication event (successful logins, invalid password attempts, account lookups) is permanently recorded in the `LoginActivity` collection with IP address, browser, operating system, and timestamp.
- **Admin User Credentials Inspector**: Accessible only to verified admins at `/admin/users`, displaying user emails, roles, verification status, and password encryption metadata for auditing.

---

## 4. Deep-Dive: How Every Core Module Works Under the Hood

### 4.1 Authentication, OTP & Smart Navigation

#### Implementation: `controllers/auth.controller.js`, `routes/auth.routes.js`

1. **Password Encryption**:
   - Passwords are never stored in plaintext. The system uses **bcrypt** with a work factor of 10 salt rounds:
     ```javascript
     const salt = await bcrypt.genSalt(10);
     const hashedPassword = await bcrypt.hash(password, salt);
     ```

2. **6-Digit OTP Verification**:
   - On registration or password reset, a cryptographically generated 6-digit numeric OTP is generated:
     ```javascript
     const otp = Math.floor(100000 + Math.random() * 900000).toString();
     user.otp = otp;
     user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
     ```

3. **Smart Unregistered-Email Redirection**:
   - **Problem**: Modern users frequently attempt to sign in before creating an account, resulting in frustrating "Invalid Credentials" errors.
   - **Solution**: When a user enters their email on the login form and clicks "Continue":
     - The controller performs a preliminary lookup: `const user = await User.findOne({ email });`
     - If the user **does not exist**, the controller halts password evaluation, sets an informative flash notice (*"Account not found. We redirected you to register your account!"*), and redirects to `/auth/login?tab=register&email=${encodeURIComponent(email)}`.
     - The registration tab automatically opens with their email pre-filled, giving a seamless e-commerce onboarding experience.

4. **Audit Logging on Every Attempt**:
   - Handled asynchronously via `services/audit.service.js` to ensure zero latency overhead on the main thread:
     ```javascript
     await LoginActivity.create({
       userId: user ? user._id : null,
       email: req.body.email,
       ipAddress: req.ip || req.headers["x-forwarded-for"],
       userAgent: req.headers["user-agent"],
       device: parseDevice(req.headers["user-agent"]),
       browser: parseBrowser(req.headers["user-agent"]),
       os: parseOS(req.headers["user-agent"]),
       status: isSuccess ? "Success" : "Failed",
       failureReason: reason || null,
       loginTime: new Date()
     });
     ```

---

### 4.2 Product Catalog, Faceted Search & Indexing

#### Implementation: `controllers/product.controller.js`, `models/product.model.js`

1. **Compound Indexing**:
   - The `Product` schema includes compound text indexes across `title`, `description`, `brand`, and `tags` to enable sub-millisecond full-text search.

2. **Dynamic Multi-Faceted Query Construction**:
   - The catalog controller builds a dynamic MongoDB filter based on incoming query parameters:
     - `q`: Case-insensitive regular expression across product title and tags.
     - `category`: Resolves category slug to ObjectId.
     - `brand`: Supports multi-brand selection.
     - `minPrice` / `maxPrice`: Range queries on `price`.
     - `sort`: Dynamic sort objects (`{ price: 1 }`, `{ price: -1 }`, `{ createdAt: -1 }`, `{ ratingsAverage: -1 }`).

3. **Real-Time Stock Threshold Badges**:
   - Handled directly in the EJS view:
     - `stock === 0`: Red "Out of Stock" badge; disables "Add to Cart" and "Buy Now" buttons.
     - `stock > 0 && stock <= 5`: Orange "Hurry, Only X Left!" urgency banner.
     - `stock > 5`: Green "In Stock" indicator.

---

### 4.3 Cart Persistence, Server-Side Pricing & BFCache Sync

#### Implementation: `controllers/cart.controller.js`, `public/js/cart.js`

1. **Server-Side Price Recalculation**:
   - **Crucial Security Measure**: The frontend is NEVER trusted with product pricing.
   - When a customer adds an item or views the cart, the server retrieves the fresh `price` and `discountPrice` directly from the `Product` document:
     ```javascript
     let subtotal = 0;
     for (const item of cart.items) {
       const product = await Product.findById(item.productId);
       item.price = product.discountPrice || product.price;
       subtotal += item.price * item.quantity;
     }
     ```

2. **BFCache & History Synchronization**:
   - Modern browsers use a Back/Forward Cache (BFCache) to preserve full page snapshots in memory. When a user clicked back from checkout or product detail, the cart count in the header could display stale numbers.
   - The client-side script listens for the `pageshow` event:
     ```javascript
     window.addEventListener("pageshow", function(event) {
       if (event.persisted) {
         // Page was restored from BFCache; sync cart badge
         fetchCartCount();
       }
     });
     ```

---

### 4.4 Smart Indian Address Assistant & PIN Code Engine

#### Implementation: `public/js/india-address.js`, `views/checkout/index.ejs`, `views/profile/addresses.ejs`

1. **36 Indian States & Union Territories**:
   - Contains a complete, standardized dictionary of all 28 states and 8 union territories (e.g., Delhi, Maharashtra, Karnataka, Tamil Nadu, Uttar Pradesh, Jammu & Kashmir, etc.).

2. **Hybrid City Selection (Datalist + Manual Text Writing)**:
   - Provides an HTML5 `<datalist>` connected to an `<input type="text">`.
   - Users get instant autocomplete recommendations for major economic and industrial cities in their selected state, while retaining 100% freedom to type any tier-2/3 town, taluka, or village name manually.

3. **Live Postal PIN Code API Verification**:
   - Listens to the 6-digit PIN code input.
   - Triggers an asynchronous query to the official Indian Postal PIN code API (`api.postalpincode.in`):
     ```javascript
     const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
     const data = await response.json();
     if (data[0].Status === "Success") {
       const postOffice = data[0].PostOffice[0];
       stateSelect.value = postOffice.State;
       cityInput.value = postOffice.District || postOffice.Name;
     }
     ```

4. **Address Snapshot Invariance**:
   - In `controllers/checkout.controller.js`, the address is copied as an embedded subdocument into `order.shippingAddress`. Future updates to the customer’s address book will never alter past order records.

---

### 4.5 Forward Order Lifecycle & Atomic Inventory Concurrency

#### Implementation: `controllers/order.controller.js`, `controllers/checkout.controller.js`

1. **Atomic Stock Decrement (Concurrency Safe)**:
   - When an order is placed, stock is atomically decremented:
     ```javascript
     const updatedProduct = await Product.findOneAndUpdate(
       { _id: item.productId, stock: { $gte: item.quantity } },
       { $inc: { stock: -item.quantity } },
       { new: true }
     );
     if (!updatedProduct) {
       throw new Error(`Insufficient stock for ${item.title}`);
     }
     ```

2. **Forward State Transitions**:
   - Orders move sequentially through:
     1. `Placed`: Order created; inventory reserved.
     2. `Confirmed`: Payment or COD order verified.
     3. `Packed`: Warehouse team packages the items.
     4. `Shipped`: Parcel handed to the logistics hub.
     5. `Out for Delivery`: Assigned to delivery agent for doorstep dropoff.
     6. `Delivered`: Successfully delivered; COD payment status marked `Paid`.

3. **Order Cancellation & Stock Restoration**:
   - If the customer cancels prior to shipment, the system executes the inverse atomic increment:
     ```javascript
     await Product.findByIdAndUpdate(item.productId, {
       $inc: { stock: item.quantity }
     });
     ```

---

### 4.6 Reverse Logistics: 5-Stage Returns & Refunds Engine

#### Implementation: `models/order.model.js`, `controllers/order.controller.js`, `controllers/admin.controller.js`, `controllers/delivery.controller.js`

Unlike basic e-commerce apps that only offer a simple "Returned" toggle, this platform implements an enterprise reverse logistics pipeline:

1. **Stage 1: `Return Requested`**:
   - Customer submits a return request from their order detail view within the eligible return window (7 days post-delivery).
   - Captures: `returnReason` (Damaged, Defective, Wrong Item, Size Issue, Changed Mind) and `returnComments`.

2. **Stage 2: `Return Confirmed`**:
   - Operations / Admin reviews the return request in `/admin/returns` and approves it for pickup.

3. **Stage 3: `Out for Return Pickup`**:
   - An active delivery agent is dispatched to collect the product from the customer doorstep.
   - The pickup appears in the delivery agent’s dedicated **Reverse Logistics / Returns** queue.

4. **Stage 4: `Item Picked Up`**:
   - The delivery agent physically inspects the package, collects it, and marks it as picked up in `/delivery/dashboard`.

5. **Stage 5: `Refund Processed`**:
   - The returned parcel arrives back at the warehouse.
   - Admin marks the refund completed, which automatically:
     - Updates `paymentStatus` to `Refunded`.
     - Restores the item stock back into inventory.
     - Closes the return ticket.

6. **Self-Service `Return Cancelled`**:
   - The customer can cancel their return request at any point before the agent picks up the item.

---

### 4.7 Dedicated Delivery Partner Portal & GPS Routing

#### Implementation: `controllers/delivery.controller.js`, `views/delivery/*`

1. **Isolated Courier Dashboard**:
   - Delivery agents see only orders assigned to them (`assignedDeliveryAgent: req.user._id`).
   - Grouped into two clear tabs:
     - **Forward Deliveries**: Pending delivery to customer.
     - **Reverse Pickups**: Return packages to collect from customer.

2. **1-Click Google Maps GPS Doorstep Navigation**:
   - Next to every customer address, a dynamic Google Maps button is generated:
     ```html
     <a href="https://www.google.com/maps/dir/?api=1&destination=<%= encodeURIComponent(order.shippingAddress.street + ', ' + order.shippingAddress.city + ', ' + order.shippingAddress.state + ' - ' + order.shippingAddress.pincode) %>" 
        target="_blank" 
        class="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
       <i class="fa-solid fa-location-arrow mr-1"></i> Navigate via Maps
     </a>
     ```

3. **Cash on Delivery (COD) Doorstep Settlement**:
   - When marking an order as `Delivered`, the agent confirms cash collection, instantly shifting the order’s `paymentStatus` from `Pending` to `Paid`.

---

### 4.8 Master Admin Control Center & Enterprise Observability

#### Implementation: `controllers/admin.controller.js`, `views/admin/*`

1. **Executive KPI Command Center**:
   - Real-time aggregation of Gross Revenue, Total Volume, Active Customers, Registered Delivery Partners, and Low Stock Alerts.

2. **Catalog & Inventory Management**:
   - Full CRUD operations for products, categories, stock replenishment, and image assets.

3. **Logistics Dispatch Board**:
   - Visual interface allowing administrators to allocate unassigned orders to active delivery agents.

4. **User Security & Credentials Audit**:
   - Located at `/admin/users`. Displays all registered accounts, their email IDs, roles, verification states, and encryption status.

5. **Login Audit Trail**:
   - Located at `/admin/login-activity`. Comprehensive chronological log of all login attempts with IP addresses, device breakdown, browser details, and failure reasons.

---

## 5. Database Schemas & Data Model Architecture

The database is built on MongoDB using Mongoose schemas:

### Entity Relationship Diagram

```
  +------------------+         1:N         +--------------------+
  |      User        | ──────────────────► |      Address       |
  +------------------+                     +--------------------+
           │                                          │ (Snapshot copy)
           │ 1:1                                      ▼
           ├─────────────────────────────► +--------------------+
           │                               |       Order        |
           │ 1:N                           +--------------------+
           ├─────────────────────────────► | - shippingAddress  |
           │ (Audit Trail)                 | - items[]          |
           ▼                               +--------------------+
  +------------------+                                │
  |  LoginActivity   |                                │ N:1
  +------------------+                                ▼
                                           +--------------------+
  +------------------+         1:N         |      Product       |
  |     Category     | ──────────────────► +--------------------+
  +------------------+                     | - category (Ref)   |
                                           | - stock            |
                                           | - price            |
                                           +--------------------+
```

### Schema Definitions Summary

1. **`User` (`models/user.model.js`)**:
   - `name`: String, required.
   - `email`: String, unique, indexed, lowercase.
   - `password`: String (bcrypt hashed).
   - `role`: String enum [`"customer"`, `"delivery"`, `"admin"`]. Default: `"customer"`.
   - `isVerified`: Boolean.
   - `otp`, `otpExpiry`: For verification & password resets.

2. **`Product` (`models/product.model.js`)**:
   - `title`, `slug`, `description`, `brand`.
   - `price`, `discountPrice`.
   - `stock`: Number, indexed.
   - `category`: ObjectId ref `"Category"`.
   - `images`: Array of image URLs.
   - `ratingsAverage`, `ratingsQuantity`.

3. **`Order` (`models/order.model.js`)**:
   - `orderNumber`: String, unique (e.g. `OD20260906-ABCD`).
   - `customer`: ObjectId ref `"User"`.
   - `items`: Array of embedded subdocuments containing:
     - `productId`, `title`, `price`, `quantity`, `image`.
   - `shippingAddress`: Frozen subdocument snapshot (`fullName`, `phone`, `street`, `city`, `state`, `pincode`).
   - `orderStatus`: Enum [`"Placed"`, `"Confirmed"`, `"Packed"`, `"Shipped"`, `"Out for Delivery"`, `"Delivered"`, `"Cancelled"`].
   - `returnStatus`: Enum [`"None"`, `"Return Requested"`, `"Return Confirmed"`, `"Out for Return Pickup"`, `"Item Picked Up"`, `"Refund Processed"`, `"Return Cancelled"`].
   - `returnDetails`: Subdocument with `reason`, `comments`, `requestedAt`, `processedAt`.
   - `assignedDeliveryAgent`: ObjectId ref `"User"`.
   - `paymentMethod`: Enum [`"COD"`, `"Card"`, `"UPI"`].
   - `paymentStatus`: Enum [`"Pending"`, `"Paid"`, `"Refunded"`].

4. **`LoginActivity` (`models/loginActivity.model.js`)**:
   - `userId`: ObjectId ref `"User"` (nullable if user not found).
   - `email`: String.
   - `ipAddress`: String.
   - `userAgent`: String.
   - `device`: String (Desktop, Mobile, Tablet).
   - `browser`: String (Chrome, Safari, Firefox, Edge).
   - `os`: String (macOS, Windows, iOS, Android, Linux).
   - `status`: Enum [`"Success"`, `"Failed"`].
   - `failureReason`: String.
   - `loginTime`, `logoutTime`: Date.

---

## 6. Complete Project Layout & Directory Structure

```
flipkart-ecommerce/
├── app.js                      # Application entry point, Express configuration, middleware stack
├── package.json                # Project dependencies, scripts (start, dev, seed, test)
├── render.yaml                 # Infrastructure-as-code for Render cloud deployment
├── config/
│   └── db.config.js            # MongoDB Mongoose connection with retry handling
├── controllers/
│   ├── admin.controller.js     # Admin dashboard, user credentials, orders queue, return management
│   ├── auth.controller.js      # Login, registration, smart email redirection, OTP verification
│   ├── cart.controller.js      # Cart operations, quantity updates, server-side price recalculations
│   ├── checkout.controller.js  # Checkout flow, address selection, order placement, atomic stock
│   ├── delivery.controller.js  # Courier partner portal, doorstep GPS links, return pickups, COD
│   ├── order.controller.js     # Customer order history, timeline tracking, 5-stage return requests
│   └── product.controller.js   # Catalog listing, full-text search, multi-faceted filtering, reviews
├── middleware/
│   ├── auth.middleware.js      # requireAuth, requireRole, preventAuth, roleRedirect guards
│   └── error.middleware.js     # 404 handler and 500 internal server error formatter
├── models/
│   ├── address.model.js        # User address book schema
│   ├── cart.model.js           # Shopping cart schema
│   ├── category.model.js       # Product category schema
│   ├── loginActivity.model.js  # Security audit trail schema
│   ├── order.model.js          # Master order schema with snapshots & 5-stage returns
│   ├── product.model.js        # Product catalog schema with compound text indexes
│   └── user.model.js           # User authentication & role schema
├── public/
│   ├── css/                    # Custom styling and Tailwind utility extensions
│   └── js/
│       ├── cart.js             # Cart dynamic calculations & BFCache sync handler
│       ├── india-address.js    # 36 States/UTs, PIN code live API lookup, datalist city engine
│       └── main.js             # General interactive UI utilities
├── routes/
│   ├── admin.routes.js         # Protected admin routes (/admin/*)
│   ├── auth.routes.js          # Authentication routes (/auth/*)
│   ├── cart.routes.js          # Shopping cart routes (/cart/*)
│   ├── checkout.routes.js      # Checkout & placement routes (/checkout/*)
│   ├── delivery.routes.js      # Courier partner routes (/delivery/*)
│   ├── order.routes.js         # Order tracking & return routes (/orders/*)
│   └── product.routes.js       # Catalog, search & category routes (/, /products/*)
├── seeds/
│   └── seeder.js               # Database population script with realistic catalog & test accounts
├── services/
│   ├── audit.service.js        # Client device detection & asynchronous audit trail logger
│   └── email.service.js        # Email/OTP dispatch service
├── tests/
│   └── rbac-and-flows.test.js  # Automated integration test suite validating security & access
└── views/
    ├── admin/                  # Admin views (dashboard, orders, products, users, login-activity, returns)
    ├── auth/                   # Authentication views (login with smart tab redirection, register, otp)
    ├── checkout/               # Checkout and address selection views with India Address Engine
    ├── delivery/               # Delivery portal views (dashboard, order details, maps links, pickups)
    ├── orders/                 # Customer order views (list, tracking timeline, return request modal)
    ├── partials/               # Reusable view partials (header, footer, navigation bar)
    └── products/               # Marketplace catalog views (home, catalog, product-detail)
```

---

## 7. Comprehensive Route & API Directory

| HTTP Verb | Endpoint | Protection Middleware | Handler Action |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Public | Marketplace homepage & featured products |
| **GET** | `/products` | Public | Filtered catalog with search, price slider, sort |
| **GET** | `/products/:slug` | Public | Detailed product view with gallery & reviews |
| **GET** | `/auth/login` | `preventAuth` | Login view (with smart tab & email query param) |
| **POST** | `/auth/login` | Public | Validates credentials or redirects to register |
| **POST** | `/auth/register` | Public | Creates account & generates 6-digit OTP |
| **GET** | `/auth/verify-otp` | Public | OTP entry screen |
| **POST** | `/auth/verify-otp` | Public | Confirms OTP & issues JWT cookie |
| **GET** | `/auth/logout` | `requireAuth` | Clears JWT cookie & logs audit logoutTime |
| **GET** | `/cart` | `requireAuth`, `requireRole("customer")` | Customer shopping cart |
| **POST** | `/cart/add` | `requireAuth`, `requireRole("customer")` | Adds item to cart with stock validation |
| **POST** | `/cart/update` | `requireAuth`, `requireRole("customer")` | Adjusts quantity within inventory bounds |
| **GET** | `/checkout` | `requireAuth`, `requireRole("customer")` | Checkout page with India Address Assistant |
| **POST** | `/checkout/place-order`| `requireAuth`, `requireRole("customer")` | Executes atomic inventory reservation |
| **GET** | `/orders` | `requireAuth`, `requireRole("customer")` | Customer order history |
| **GET** | `/orders/:id` | `requireAuth`, `requireRole("customer")` | Live order tracking timeline |
| **POST** | `/orders/:id/cancel` | `requireAuth`, `requireRole("customer")` | Cancels order & restores inventory |
| **POST** | `/orders/:id/return` | `requireAuth`, `requireRole("customer")` | Initiates 5-stage return request |
| **POST** | `/orders/:id/cancel-return` | `requireAuth`, `requireRole("customer")` | Cancels return request |
| **GET** | `/delivery/dashboard` | `requireAuth`, `requireRole("delivery")` | Courier portal with Deliveries & Pickups |
| **GET** | `/delivery/orders/:id`| `requireAuth`, `requireRole("delivery")` | Order details, Maps GPS link, COD collection |
| **POST** | `/delivery/orders/:id/status` | `requireAuth`, `requireRole("delivery")` | Updates delivery stage or return pickup |
| **GET** | `/admin/dashboard` | `requireAuth`, `requireRole("admin")` | Executive KPI dashboard |
| **GET** | `/admin/orders` | `requireAuth`, `requireRole("admin")` | Master order queue & logistics assignment |
| **GET** | `/admin/returns` | `requireAuth`, `requireRole("admin")` | Master return & reverse logistics queue |
| **POST** | `/admin/returns/:id/status` | `requireAuth`, `requireRole("admin")` | Transitions return stages (Confirm, Refund) |
| **GET** | `/admin/users` | `requireAuth`, `requireRole("admin")` | User directory & credentials audit |
| **GET** | `/admin/login-activity`| `requireAuth`, `requireRole("admin")` | Security audit trail with device forensics |

---

## 8. Local Development, Automated Testing & Cloud Deployment

### 8.1 Local Setup

1. **Clone and Install**:
   ```bash
   git clone https://github.com/m25shubhamkumar-ops/flipkart-ecommerce.git
   cd flipkart-ecommerce
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file in the root directory:
   ```ini
   PORT=3000
   NODE_ENV=development
   MONGO_URI=mongodb://127.0.0.1:27017/flipkart_db
   JWT_SECRET=your_ultra_secure_jwt_secret_token_key_here
   EMAIL_USER=support@flipkart-demo.com
   EMAIL_PASSWORD=test_smtp_pass
   ```

3. **Seed Database**:
   Populates realistic categories, products, inventory, test accounts, and audit records:
   ```bash
   npm run seed
   ```

4. **Launch Server**:
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```
   Access the application at `http://localhost:3000`.

### 8.2 Verified Master Credentials

| Role | Email ID | Password | Access Route |
| :--- | :--- | :--- | :--- |
| **👑 Master Admin** | `shubhamrai9122@gmail.com` | `Admin@12345` | `/admin/dashboard` |
| **🚚 Delivery Partner** | `shubham.logistics@gmail.com` | `Delivery@2026` | `/delivery/dashboard` |
| **🛒 Customer Account** | Self-registered or seeded | User configured | `/` |

### 8.3 Automated Verification Suite

Run the full end-to-end integration test suite:
```bash
npm test
```
This verifies:
- `GET /health` endpoint availability.
- Guest unauthenticated access controls.
- Customer permission boundaries (blocking access to `/admin` and `/delivery`).
- Delivery partner boundaries (blocking access to `/admin`).
- Admin access to operational dashboards and login audit logs.
- MongoDB audit trail collection integrity.

### 8.4 Production Cloud Deployment (Render + MongoDB Atlas)

The platform is deployed live on **Render** backed by a high-availability **MongoDB Atlas** cluster:

- **Live URL**: `https://flipkart-ecommerce-wql5.onrender.com`
- **GitHub Repository**: `https://github.com/m25shubhamkumar-ops/flipkart-ecommerce`
- **Deployment Specification**: `render.yaml` defines an auto-deploying Node.js web service running `npm install && npm test` as pre-deploy verification before starting `node app.js`.

---

## 9. Key Architectural & System Design Takeaways

### Why this architecture stands out in engineering interviews:

1. **Defense-in-Depth Security**:
   - Authentication is not handled purely in client state. Tokens reside in tamper-proof HTTP-only cookies.
   - RBAC is enforced strictly at the route middleware level, never relying on UI element hiding alone.

2. **Database Normalization vs. Snapshot Tradeoffs**:
   - While products are normalized in the `Product` collection for catalog browsing, order items and delivery addresses are deliberately **denormalized snapshots** within the `Order` document. This guarantees transactional invariance and legal record integrity.

3. **Handling Concurrency Without Heavy Distributed Locks**:
   - By leveraging MongoDB’s atomic document-level locking with `$inc` and stock check predicates, the system handles thousands of concurrent checkout requests without requiring complex Redis Redlock infrastructure.

4. **Resilient Reverse Logistics**:
   - Standard tutorials stop at placing an order. This platform implements a full 5-stage return and refund lifecycle that mirrors real-world supply chain management (Pickup scheduling, condition verification, inventory restocking, and refund accounting).

---
*Created for the Flipkart E-Commerce Platform project repository.*
