const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/rbac.middleware');

// Apply auth and admin role checks to all admin routes
router.use('/admin', requireAuth, requireAdmin);

router.get('/admin', (req, res) => res.redirect('/admin/dashboard'));
router.get('/admin/dashboard', adminController.getDashboard);

// Products CRUD
router.get('/admin/products', adminController.getProducts);
router.get('/admin/products/new', adminController.getNewProduct);
router.post('/admin/products', adminController.postCreateProduct);
router.get('/admin/products/:id/edit', adminController.getEditProduct);
router.post('/admin/products/:id/edit', adminController.postUpdateProduct);
router.post('/admin/products/:id/delete', adminController.postDeleteProduct);

// Categories CRUD
router.get('/admin/categories', adminController.getCategories);
router.post('/admin/categories', adminController.postCreateCategory);
router.post('/admin/categories/:id/delete', adminController.postDeleteCategory);

// Orders Management & Delivery Assignment
router.get('/admin/orders', adminController.getOrders);
router.get('/admin/orders/:id', adminController.getOrderDetail);
router.post('/admin/orders/:id/status', adminController.postUpdateOrderStatus);

// Returns & Refunds Management
router.get('/admin/returns', adminController.getReturnRequests);
router.post('/admin/orders/:id/return-action', adminController.postProcessReturnAction);


// Users Directory & Role Management
router.get('/admin/users', adminController.getUsers);
router.post('/admin/users/:id/role', adminController.postUpdateUserRole);
router.post('/admin/users/:id/toggle-status', adminController.postToggleUserStatus);

// Audit Trail / Login Activity (PDF Section 5)
router.get('/admin/login-activity', adminController.getLoginActivity);

module.exports = router;
