const mongoose = require('mongoose');

const loginActivitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    loginTime: { type: Date, default: Date.now, index: true },
    logoutTime: { type: Date, default: null },
    status: { type: String, enum: ['success', 'failed'], required: true },
    failureReason: { type: String, default: '' },
    ipAddress: { type: String, default: '127.0.0.1' },
    userAgent: { type: String, default: '' },
    device: { type: String, default: 'Desktop' },
    browser: { type: String, default: 'Chrome' },
    operatingSystem: { type: String, default: 'macOS' },
    authenticationMethod: {
      type: String,
      enum: ['password', 'password+otp'],
      default: 'password'
    }
  },
  { timestamps: true }
);

loginActivitySchema.index({ email: 1, loginTime: -1 });

module.exports = mongoose.model('LoginActivity', loginActivitySchema);
