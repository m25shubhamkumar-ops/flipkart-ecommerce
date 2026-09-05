const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otpHash: { type: String, required: true },
    purpose: {
      type: String,
      enum: ['registration', 'password_reset', 'login'],
      default: 'registration'
    },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index automatically cleans up expired OTPs
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('OtpToken', otpSchema);
