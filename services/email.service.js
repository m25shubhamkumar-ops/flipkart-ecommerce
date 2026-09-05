const nodemailer = require('nodemailer');

const sendOTPEmail = async (email, otp, purpose = 'Verification') => {
  console.log('\n======================================================');
  console.log(`✉️  [EMAIL DISPATCH] Purpose: ${purpose.toUpperCase()}`);
  console.log(`✉️  Target Inbox: ${email}`);
  console.log(`✉️  OTP CODE: >>>  ${otp}  <<<`);
  console.log(`✉️  Valid for 5 minutes.`);
  console.log('======================================================\n');

  // If real Gmail SMTP credentials are provided in environment
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (user && pass && pass !== 'test_smtp_pass' && pass !== 'secret_smtp_password') {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });

      await transporter.sendMail({
        from: `"Flipkart Security" <${user}>`,
        to: email,
        subject: `Your Flipkart ${purpose} OTP: ${otp}`,
        text: `Your Flipkart OTP code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #2874f0; padding: 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 900;">Flipkart</h1>
            </div>
            <div style="padding: 24px; color: #212121;">
              <p style="font-size: 15px;">Hello,</p>
              <p>Your one-time password (OTP) for <strong>${purpose}</strong> is:</p>
              <div style="background: #f1f3f6; padding: 18px; font-size: 36px; font-weight: 900; text-align: center; letter-spacing: 8px; color: #2874f0; border-radius: 6px; margin: 20px 0;">
                ${otp}
              </div>
              <p style="color: #878787; font-size: 12px;">This code is valid for 5 minutes. If you did not request this, please disregard this email.</p>
            </div>
          </div>
        `
      });
      console.log(`[Email Service] Successfully sent real OTP email to: ${email}`);
      return true;
    } catch (err) {
      console.error(`[Email Service] Gmail SMTP error: ${err.message}. (Make sure to use a Google App Password)`);
    }
  }

  return true;
};

module.exports = {
  sendOTPEmail
};
