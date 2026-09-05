const nodemailer = require('nodemailer');
const https = require('https');

// Helper to send email via Brevo REST API (HTTPS port 443 - never blocked by Render)
const sendViaBrevoApi = (apiKey, senderEmail, toEmail, otp, purpose) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender: { name: 'Flipkart Security', email: senderEmail },
      to: [{ email: toEmail }],
      subject: `Your Flipkart Verification OTP: ${otp}`,
      htmlContent: `
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

    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          reject(new Error(`Brevo HTTP API status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Brevo API timeout after 5s'));
    });
    req.write(payload);
    req.end();
  });
};

const sendOTPEmail = async (email, otp, purpose = 'Verification') => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  const brevoKey = process.env.BREVO_API_KEY;

  console.log(`[Email Service] Dispatching OTP code for ${email}...`);

  // Priority 1: If Brevo HTTP API key is set, use HTTPS port 443 (works everywhere, including Render Free tier)
  if (brevoKey) {
    try {
      await sendViaBrevoApi(brevoKey, user || 'no-reply@flipkart.com', email, otp, purpose);
      console.log(`[Email Service] ✅ Real OTP email sent via Brevo HTTPS API to ${email}`);
      return true;
    } catch (err) {
      console.error(`[Email Service] Brevo HTTPS API error: ${err.message}`);
    }
  }

  // Priority 2: Gmail SMTP (works locally and on non-restricted networks)
  if (user && pass && pass !== 'test_smtp_pass' && pass !== 'secret_smtp_password') {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass
        },
        connectionTimeout: 4000, // 4-second fail-fast timeout so server doesn't hang on blocked ports
        greetingTimeout: 4000,
        socketTimeout: 4000
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
      console.warn(`[Email Service] ⚠️ SMTP connection warning (${err.message}). (Note: Render free tier blocks outbound SMTP ports 465/587).`);
      return false;
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

