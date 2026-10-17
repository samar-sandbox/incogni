import { rm, rmdir, unlink } from "node:fs/promises";
import { BadRequestError } from "../exceptions/app.exception.js";

export function validation(schema) {
  return async function (req, res, next) {
    const result = schema(req.lang).safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
      files: req.paths,
    });

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .join(", ");

      if (req.dist) {
        await rm(req.dist, { recursive: true });
      }

      return BadRequestError(message);
    }

    req.data = result.data;
    next();
  };
}
