export default function errorHandler(err, req, res, next) {
  const errors = Object.entries(err.errors || {});

  let message = err.message;
  if (errors.length > 0) {
    let errObj = {};
    errors.forEach(([path, { message }]) => {
      errObj[path] = message;
    });
    message = errObj;
  }

  const status = err.cause?.status ?? 500;

  return res.status(errors.length > 0 ? 400 : status).json({
    success: false,
    message,
  });
}
