const useragent = require('useragent');
const LoginActivity = require('../models/loginActivity.model');

const recordLoginAttempt = async (req, { email, userId = null, status, failureReason = '', authMethod = 'password' }) => {
  try {
    const rawUa = req.headers['user-agent'] || '';
    const agent = useragent.parse(rawUa);

    // Resolve IP address
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '127.0.0.1';
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      ip = '127.0.0.1';
    }

    const device = agent.device.toString() === 'Other 0.0.0' ? 'Desktop' : agent.device.toString();
    const browser = agent.toAgent();
    const os = agent.os.toString();

    const activity = await LoginActivity.create({
      userId,
      email: email ? email.toLowerCase().trim() : 'unknown',
      loginTime: new Date(),
      status,
      failureReason,
      ipAddress: ip,
      userAgent: rawUa.substring(0, 500),
      device,
      browser,
      operatingSystem: os,
      authenticationMethod: authMethod
    });

    return activity;
  } catch (error) {
    console.error(`[Audit] Failed to log login attempt: ${error.message}`);
    return null;
  }
};

const recordLogout = async (userId, email) => {
  try {
    if (!userId && !email) return;
    // Find the latest active session to mark logoutTime
    const query = userId ? { userId } : { email };
    await LoginActivity.findOneAndUpdate(
      { ...query, status: 'success', logoutTime: null },
      { logoutTime: new Date() },
      { sort: { loginTime: -1 } }
    );
  } catch (error) {
    console.error(`[Audit] Failed to record logout: ${error.message}`);
  }
};

module.exports = {
  recordLoginAttempt,
  recordLogout
};
