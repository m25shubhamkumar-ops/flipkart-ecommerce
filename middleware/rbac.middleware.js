// Restrict to specified roles
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).render('errors/403', {
        title: 'Access Denied - Flipkart',
        message: `Your account role (${req.user.role}) does not have permission to view this section.`
      });
    }

    next();
  };
};

const requireCustomer = requireRole('customer', 'admin');
const requireDelivery = requireRole('delivery', 'admin');
const requireAdmin = requireRole('admin');

module.exports = {
  requireRole,
  requireCustomer,
  requireDelivery,
  requireAdmin
};
