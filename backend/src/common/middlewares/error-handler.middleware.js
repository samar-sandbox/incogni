import { MulterError } from "multer";

export function errorHandler(err, req, res, next) {
  let errMessage = err.message;
  if (err instanceof MulterError) {
    errMessage = {
      message: errMessage,
      ...err,
    };
  }

  return res.status(err.cause?.status ?? 500).json({
    success: false,
    message: errMessage,
  });
}
