const nodemailer = require('nodemailer');

const sendOTPEmail = async (email, otp, purpose = 'Verification') => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  console.log(`[Email Service] Dispatching OTP code for ${email}...`);

  if (user && pass && pass !== 'test_smtp_pass' && pass !== 'secret_smtp_password') {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass
        }
      });

      const info = await transporter.sendMail({
        from: `"Flipkart Security" <${user}>`,
        to: email,
        subject: `Your Flipkart Verification OTP: ${otp}`,
        text: `Your Flipkart ${purpose} OTP code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #2874f0; padding: 24px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 1px;">Flipkart</h1>
            </div>
            <div style="padding: 28px; color: #212121; background-color: #ffffff;">
              <p style="font-size: 16px; margin-top: 0;">Hello,</p>
              <p style="font-size: 14px; color: #555;">Use the following One-Time Password (OTP) to complete your <strong>${purpose}</strong>:</p>
              <div style="background: #f1f3f6; padding: 18px; font-size: 38px; font-weight: 900; text-align: center; letter-spacing: 10px; color: #2874f0; border-radius: 8px; margin: 24px 0; font-family: monospace;">
                ${otp}
              </div>
              <p style="color: #878787; font-size: 12px; line-height: 1.5;">This OTP is valid for <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 24px 0;">
              <p style="color: #aaaaaa; font-size: 11px; margin-bottom: 0;">© 2026 Flipkart Internet Private Limited. All rights reserved.</p>
            </div>
          </div>
        `
      });

      console.log(`[Email Service] ✅ Real OTP email sent to ${email}. ID: ${info.messageId}`);
      return true;
    } catch (err) {
      console.error(`[Email Service] ❌ Gmail SMTP Error: ${err.message}`);
      throw new Error(`Could not deliver email to Gmail: ${err.message}`);
    }
  } else {
    console.log('\n======================================================');
    console.log(`✉️  [GMAIL SIMULATION] Target: ${email}`);
    console.log(`✉️  Configure EMAIL_USER and EMAIL_PASSWORD (App Password) to deliver live.`);
    console.log('======================================================\n');
  }

  return true;
};

module.exports = {
  sendOTPEmail
};
