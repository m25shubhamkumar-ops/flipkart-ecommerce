const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const OtpToken = require('../models/otp.model');

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const createAndSaveOTP = async (email, purpose = 'registration', userId = null) => {
  const otp = generateOTP();
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(otp, salt);

  // Expire in 5 minutes (Page 5)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Invalidate any previous OTP for same email & purpose
  await OtpToken.deleteMany({ email, purpose });

  await OtpToken.create({
    userId,
    email,
    otpHash,
    purpose,
    expiresAt,
    attempts: 0,
    verified: false
  });

  return otp; // Return raw OTP to be emailed
};

const verifySubmittedOTP = async (email, submittedOTP, purpose = 'registration') => {
  const record = await OtpToken.findOne({ email, purpose }).sort({ createdAt: -1 });
  if (!record) {
    return { valid: false, message: 'No active OTP found. Please request a new one.' };
  }

  if (record.verified) {
    return { valid: false, message: 'OTP has already been used.' };
  }

  if (new Date() > record.expiresAt) {
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  if (record.attempts >= 5) {
    return { valid: false, message: 'Maximum attempts exceeded. Please request a new OTP.' };
  }

  const isMatch = await bcrypt.compare(submittedOTP, record.otpHash);
  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    return { valid: false, message: `Invalid OTP. ${5 - record.attempts} attempt(s) remaining.` };
  }

  record.verified = true;
  await record.save();

  return { valid: true, record };
};

module.exports = {
  generateOTP,
  createAndSaveOTP,
  verifySubmittedOTP
};
