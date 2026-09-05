const nodemailer = require('nodemailer');

const sendOTPEmail = async (email, otp, purpose = 'Verification') => {
  console.log('\n======================================================');
  console.log(`✉️  [EMAIL SERVICE] Purpose: ${purpose.toUpperCase()}`);
  console.log(`✉️  Recipient: ${email}`);
  console.log(`✉️  OTP CODE: >>>  ${otp}  <<<`);
  console.log(`✉️  Valid for 5 minutes.`);
  console.log('======================================================\n');

  // Attempt real nodemailer if SMTP config exists
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && process.env.EMAIL_PASSWORD !== 'test_smtp_pass') {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      await transporter.sendMail({
        from: `"Flipkart Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Your OTP Code for ${purpose}: ${otp}`,
        text: `Your Flipkart verification code is: ${otp}. Valid for 5 minutes. Never share your OTP with anyone.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #2874f0; padding: 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px;">Flipkart</h1>
            </div>
            <div style="padding: 24px; color: #212121;">
              <p style="font-size: 16px;">Hello,</p>
              <p>Your one-time password (OTP) for <strong>${purpose}</strong> is:</p>
              <div style="background: #f1f3f6; padding: 16px; font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 6px; color: #2874f0; border-radius: 6px;">
                ${otp}
              </div>
              <p style="color: #878787; font-size: 13px; margin-top: 20px;">This OTP is valid for 5 minutes. If you did not request this, please ignore this email.</p>
            </div>
          </div>
        `
      });
    } catch (err) {
      console.warn(`[Nodemailer fallback] Could not send via SMTP: ${err.message}. Raw OTP logged to console.`);
    }
  }

  return true;
};

module.exports = {
  sendOTPEmail
};
