const notFoundHandler = (req, res, next) => {
  res.status(404).render('errors/404', {
    title: '404 - Page Not Found | Flipkart',
    message: `The page at "${req.originalUrl}" does not exist or has been moved.`
  });
};

const errorHandler = (err, req, res, next) => {
  console.error('[Error Middleware]:', err);
  const status = err.status || 500;
  res.status(status).render('errors/500', {
    title: '500 - Server Error | Flipkart',
    message: err.message || 'An unexpected error occurred.',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};
