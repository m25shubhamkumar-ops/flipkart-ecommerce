const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Cart = require('../models/cart.model');
const { createAndSaveOTP, verifySubmittedOTP } = require('../services/otp.service');
const { sendOTPEmail } = require('../services/email.service');
const { generateToken } = require('../services/token.service');
const { recordLoginAttempt, recordLogout } = require('../utils/audit.helper');

const mergeGuestCart = async (req, res, userId) => {
  try {
    const raw = req.cookies?.guest_cart;
    if (!raw) return;
    const guestItems = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(guestItems) || guestItems.length === 0) return;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    for (const gi of guestItems) {
      const idx = cart.items.findIndex(i => i.productId.toString() === gi.productId.toString());
      if (idx > -1) {
        cart.items[idx].quantity += gi.quantity || 1;
      } else {
        cart.items.push({
          productId: gi.productId,
          quantity: gi.quantity || 1,
          priceSnapshot: gi.priceSnapshot || 0
        });
      }
    }

    await cart.save();
    res.clearCookie('guest_cart', { path: '/' });
  } catch (err) {
    console.error('Error merging guest cart:', err);
  }
};


// Render Register Page
exports.getRegister = (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('auth/register', {
    title: 'Register - Flipkart',
    error: null,
    formData: {}
  });
};

// Handle Registration
exports.postRegister = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, role } = req.body;
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const cleanPhone = phone ? phone.trim() : '';

    if (!name || !cleanEmail || !password || !cleanPhone) {
      return res.render('auth/register', {
        title: 'Register - Flipkart',
        error: 'Please fill in all required fields including your 10-digit mobile number.',
        formData: req.body
      });
    }

    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.render('auth/register', {
        title: 'Register - Flipkart',
        error: 'Mobile number must be exactly 10 digits.',
        formData: req.body
      });
    }

    if (password !== confirmPassword) {
      return res.render('auth/register', {
        title: 'Register - Flipkart',
        error: 'Passwords do not match.',
        formData: req.body
      });
    }

    if (password.length < 6) {
      return res.render('auth/register', {
        title: 'Register - Flipkart',
        error: 'Password must be at least 6 characters long.',
        formData: req.body
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.render('auth/register', {
        title: 'Register - Flipkart',
        error: 'An account with this email already exists.',
        formData: req.body
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userRole = ['customer', 'delivery'].includes(role) ? role : 'customer';

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash,
      role: userRole,
      isVerified: false
    });

    // Generate & send OTP directly to user's Gmail
    const otp = await createAndSaveOTP(cleanEmail, 'registration', user._id);
    await sendOTPEmail(cleanEmail, otp, 'Account Verification');

    res.redirect(`/verify-otp?email=${encodeURIComponent(cleanEmail)}&role=${userRole}`);
  } catch (error) {
    console.error('Registration error:', error);
    res.render('auth/register', {
      title: 'Register - Flipkart',
      error: error.message || 'An error occurred during registration. Please try again.',
      formData: req.body
    });
  }
};

// Render OTP Verification Page (No OTP shown on screen!)
exports.getVerifyOtp = (req, res) => {
  const { email, role } = req.query;
  if (!email) return res.redirect('/register');

  res.render('auth/verify-otp', {
    title: 'Verify OTP - Flipkart',
    email,
    role: role || 'customer',
    error: null,
    success: null
  });
};

// Process OTP Verification
exports.postVerifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const cleanEmail = email ? email.toLowerCase().trim() : '';

  try {
    const result = await verifySubmittedOTP(cleanEmail, otp, 'registration');
    if (!result.valid) {
      return res.render('auth/verify-otp', {
        title: 'Verify OTP - Flipkart',
        email: cleanEmail,
        role: req.body.role || 'customer',
        error: result.message,
        success: null
      });
    }

    const user = await User.findOneAndUpdate(
      { email: cleanEmail },
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.redirect('/register');
    }

    // Auto-login after successful verification
    const token = generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    await recordLoginAttempt(req, {
      email: cleanEmail,
      userId: user._id,
      status: 'success',
      authMethod: 'password+otp'
    });

    await mergeGuestCart(req, res, user._id);

    if (user.role === 'admin') return res.redirect('/admin/dashboard');
    if (user.role === 'delivery') return res.redirect('/delivery/dashboard');
    res.redirect('/');

  } catch (error) {
    console.error('OTP verify error:', error);
    res.render('auth/verify-otp', {
      title: 'Verify OTP - Flipkart',
      email: cleanEmail,
      role: 'customer',
      error: 'Verification failed. Please try again.',
      success: null
    });
  }
};

// Resend OTP to Inbox
exports.postResendOtp = async (req, res) => {
  const { email, purpose } = req.body;
  const cleanEmail = email ? email.toLowerCase().trim() : '';
  try {
    const otp = await createAndSaveOTP(cleanEmail, purpose || 'registration');
    await sendOTPEmail(cleanEmail, otp, 'OTP Resend');
    res.json({ success: true, message: 'New OTP dispatched to your Gmail inbox.' });
  } catch (err) {
    console.error('postResendOtp error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to resend OTP.' });
  }
};


// Render Login Page
exports.getLogin = (req, res) => {
  if (req.user) {
    if (req.user.role === 'admin') return res.redirect('/admin/dashboard');
    if (req.user.role === 'delivery') return res.redirect('/delivery/dashboard');
    return res.redirect('/');
  }

  res.render('auth/login', {
    title: 'Login - Flipkart',
    error: null,
    success: req.query.registered ? 'Registration successful! Please log in.' : null,
    redirect: req.query.redirect || ''
  });
};

// Handle Login
exports.postLogin = async (req, res) => {
  const { email, password, redirect } = req.body;
  const cleanEmail = email ? email.toLowerCase().trim() : '';

  try {
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      await recordLoginAttempt(req, {
        email: cleanEmail,
        status: 'failed',
        failureReason: 'User not found'
      });
      return res.render('auth/login', {
        title: 'Login - Flipkart',
        error: 'Invalid email or password.',
        success: null,
        redirect
      });
    }

    if (!user.isActive) {
      await recordLoginAttempt(req, {
        email: cleanEmail,
        userId: user._id,
        status: 'failed',
        failureReason: 'Account suspended'
      });
      return res.render('auth/login', {
        title: 'Login - Flipkart',
        error: 'This account has been deactivated. Please contact support.',
        success: null,
        redirect
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await recordLoginAttempt(req, {
        email: cleanEmail,
        userId: user._id,
        status: 'failed',
        failureReason: 'Incorrect password'
      });
      return res.render('auth/login', {
        title: 'Login - Flipkart',
        error: 'Invalid email or password.',
        success: null,
        redirect
      });
    }

    const token = generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    await recordLoginAttempt(req, {
      email: cleanEmail,
      userId: user._id,
      status: 'success',
      authMethod: 'password'
    });

    await mergeGuestCart(req, res, user._id);

    if (redirect && redirect.startsWith('/')) {
      return res.redirect(redirect);
    }

    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    }
    if (user.role === 'delivery') {
      return res.redirect('/delivery/dashboard');
    }
    return res.redirect('/');
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', {
      title: 'Login - Flipkart',
      error: 'An unexpected error occurred during login. Please try again.',
      success: null,
      redirect
    });
  }
};

// Handle Logout
exports.getLogout = async (req, res) => {
  try {
    if (req.user) {
      await recordLogout(req.user._id, req.user.email);
    }
  } catch (err) {
    console.error('Logout audit error:', err);
  }
  res.clearCookie('token');
  res.redirect('/login');
};

// Forgot Password Views and Actions
exports.getForgotPassword = (req, res) => {
  res.render('auth/forgot-password', {
    title: 'Forgot Password - Flipkart',
    error: null,
    success: null
  });
};

exports.postForgotPassword = async (req, res) => {
  const { email } = req.body;
  const cleanEmail = email ? email.toLowerCase().trim() : '';

  try {
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.render('auth/forgot-password', {
        title: 'Forgot Password - Flipkart',
        error: 'No account registered with that email address.',
        success: null
      });
    }

    const otp = await createAndSaveOTP(cleanEmail, 'password_reset', user._id);
    await sendOTPEmail(cleanEmail, otp, 'Password Reset');

    res.redirect(`/reset-password?email=${encodeURIComponent(cleanEmail)}`);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.render('auth/forgot-password', {
      title: 'Forgot Password - Flipkart',
      error: 'Failed to process password reset. Please try again.',
      success: null
    });
  }
};

exports.getResetPassword = (req, res) => {
  const { email } = req.query;
  if (!email) return res.redirect('/forgot-password');
  res.render('auth/reset-password', {
    title: 'Reset Password - Flipkart',
    email,
    error: null
  });
};

exports.postResetPassword = async (req, res) => {
  const { email, otp, password, confirmPassword } = req.body;
  const cleanEmail = email ? email.toLowerCase().trim() : '';

  try {
    if (password !== confirmPassword) {
      return res.render('auth/reset-password', {
        title: 'Reset Password - Flipkart',
        email: cleanEmail,
        error: 'Passwords do not match.'
      });
    }

    if (password.length < 6) {
      return res.render('auth/reset-password', {
        title: 'Reset Password - Flipkart',
        email: cleanEmail,
        error: 'Password must be at least 6 characters.'
      });
    }

    const result = await verifySubmittedOTP(cleanEmail, otp, 'password_reset');
    if (!result.valid) {
      return res.render('auth/reset-password', {
        title: 'Reset Password - Flipkart',
        email: cleanEmail,
        error: result.message
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await User.findOneAndUpdate({ email: cleanEmail }, { passwordHash });

    res.render('auth/login', {
      title: 'Login - Flipkart',
      success: 'Password reset successful! You may now sign in.',
      error: null,
      redirect: ''
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.render('auth/reset-password', {
      title: 'Reset Password - Flipkart',
      email: cleanEmail,
      error: 'Failed to reset password. Please try again.'
    });
  }
};
