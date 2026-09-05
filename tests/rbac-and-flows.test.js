const assert = require('assert');
const http = require('http');
const mongoose = require('mongoose');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = 3099;

const app = require('../app');
const User = require('../models/user.model');
const Order = require('../models/order.model');
const LoginActivity = require('../models/loginActivity.model');
const { generateToken } = require('../services/token.service');

let server;
const BASE_URL = 'http://127.0.0.1:3099';

const request = (path, options = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body: data
      }));
    });

    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('🧪 Starting Flipkart E-Commerce Verification Tests...\n');

  // Start HTTP server on port 3099
  server = app.listen(3099);
  await new Promise(resolve => server.on('listening', resolve));

  try {
    // 1. Health check
    console.log('Test 1: Health Check Endpoint');
    const healthRes = await request('/health');
    assert.strictEqual(healthRes.statusCode, 200);
    const healthData = JSON.parse(healthRes.body);
    assert.strictEqual(healthData.status, 'UP');
    console.log('  ✅ GET /health returns 200 UP\n');

    // 2. Fetch seeded users
    const customer = await User.findOne({ role: 'customer' });
    const delivery = await User.findOne({ role: 'delivery' });
    const admin = await User.findOne({ role: 'admin' });

    assert.ok(customer, 'Customer user should exist');
    assert.ok(delivery, 'Delivery user should exist');
    assert.ok(admin, 'Admin user should exist');

    const customerToken = generateToken(customer);
    const deliveryToken = generateToken(delivery);
    const adminToken = generateToken(admin);

    // 3. Guest Access Restrictions
    console.log('Test 2: Guest Security Boundaries');
    const guestCheckoutRes = await request('/checkout');
    assert.strictEqual(guestCheckoutRes.statusCode, 302, 'Guest should be redirected when accessing /checkout');
    assert.ok(guestCheckoutRes.headers.location.includes('/login'), 'Redirect location should be login');

    const guestAdminRes = await request('/admin/dashboard');
    assert.strictEqual(guestAdminRes.statusCode, 302, 'Guest should be redirected from /admin');

    const guestDeliveryRes = await request('/delivery/dashboard');
    assert.strictEqual(guestDeliveryRes.statusCode, 302, 'Guest should be redirected from /delivery');
    console.log('  ✅ Unauthenticated requests properly redirected to /login\n');

    // 4. Role-Based Access Control (Customer)
    console.log('Test 3: Customer Role Permissions');
    const custCartRes = await request('/cart', {
      headers: { Cookie: `token=${customerToken}` }
    });
    assert.strictEqual(custCartRes.statusCode, 200, 'Customer should access cart');

    const custAdminRes = await request('/admin/dashboard', {
      headers: { Cookie: `token=${customerToken}` }
    });
    assert.strictEqual(custAdminRes.statusCode, 403, 'Customer MUST receive 403 when accessing Admin');

    const custDeliveryRes = await request('/delivery/dashboard', {
      headers: { Cookie: `token=${customerToken}` }
    });
    assert.strictEqual(custDeliveryRes.statusCode, 403, 'Customer MUST receive 403 when accessing Delivery');
    console.log('  ✅ Customer allowed in /cart, strictly blocked (403) from /admin and /delivery\n');

    // 5. Role-Based Access Control (Delivery Agent)
    console.log('Test 4: Delivery Agent Role Permissions');
    const delivDashRes = await request('/delivery/dashboard', {
      headers: { Cookie: `token=${deliveryToken}` }
    });
    assert.strictEqual(delivDashRes.statusCode, 200, 'Delivery agent should access delivery dashboard');

    const delivAdminRes = await request('/admin/dashboard', {
      headers: { Cookie: `token=${deliveryToken}` }
    });
    assert.strictEqual(delivAdminRes.statusCode, 403, 'Delivery agent MUST receive 403 when accessing Admin');
    console.log('  ✅ Delivery agent allowed in /delivery, strictly blocked (403) from /admin\n');

    // 6. Role-Based Access Control (Admin)
    console.log('Test 5: Admin Role Permissions');
    const adminDashRes = await request('/admin/dashboard', {
      headers: { Cookie: `token=${adminToken}` }
    });
    assert.strictEqual(adminDashRes.statusCode, 200, 'Admin should access admin dashboard');

    const adminAuditRes = await request('/admin/login-activity', {
      headers: { Cookie: `token=${adminToken}` }
    });
    assert.strictEqual(adminAuditRes.statusCode, 200, 'Admin should access login audit trail');
    console.log('  ✅ Admin allowed in /admin/dashboard and /admin/login-activity\n');

    // 7. Audit Trail Persistence
    console.log('Test 6: Audit Trail & Login Activity Verification');
    const auditCount = await LoginActivity.countDocuments();
    assert.ok(auditCount > 0, 'Audit logs should exist in MongoDB');
    console.log(`  ✅ Successfully verified ${auditCount} LoginActivity audit trail records in MongoDB\n`);

    console.log('====================================================');
    console.log('🎉 ALL AUTOMATED RBAC AND SECURITY TESTS PASSED!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTests();
