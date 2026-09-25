export function errorHandler(err, req, res, next) {
  return res.status(err.cause?.status ?? 500).json({
    success: false,
    message: err.message,
  });
}
