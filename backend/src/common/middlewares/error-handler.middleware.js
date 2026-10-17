import { rm } from "node:fs/promises";
import { MulterError } from "multer";

export async function errorHandler(err, req, res, next) {
  let errMessage = err.message;
  if (err instanceof MulterError) {
    errMessage = {
      message: errMessage,
      ...err,
    };
  }

  if (req.dist) {
    await rm(req.dist, { recursive: true });
  }

  return res.status(err.cause?.status ?? 500).json({
    success: false,
    message: errMessage,
  });
}
