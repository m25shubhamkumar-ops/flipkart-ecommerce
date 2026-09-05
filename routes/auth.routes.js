const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

router.get('/verify-otp', authController.getVerifyOtp);
router.post('/verify-otp', authController.postVerifyOtp);
router.post('/resend-otp', authController.postResendOtp);

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', authController.getLogout);

router.get('/forgot-password', authController.getForgotPassword);
router.post('/forgot-password', authController.postForgotPassword);
router.get('/reset-password', authController.getResetPassword);
router.post('/reset-password', authController.postResetPassword);

module.exports = router;
