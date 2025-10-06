// middleware/error_handler.js

/**
 * Express global error handler
 */
export default function errorHandler(err, req, res, next) {
  console.error(err.stack || err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
}
