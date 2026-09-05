const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const addressController = require('../controllers/address.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/profile', requireAuth, profileController.getProfile);
router.post('/profile/update', requireAuth, profileController.postUpdateProfile);
router.post('/profile/change-password', requireAuth, profileController.postChangePassword);

router.get('/profile/addresses', requireAuth, addressController.getAddresses);
router.post('/profile/addresses', requireAuth, addressController.postCreateAddress);
router.post('/profile/addresses/:id/default', requireAuth, addressController.postSetDefaultAddress);
router.post('/profile/addresses/:id/delete', requireAuth, addressController.postDeleteAddress);

module.exports = router;
