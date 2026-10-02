import { BadRequestError } from "../utils/index.js";

export function validation(schema) {
  return function (req, res, next) {
    const result = schema(req.lang).safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .join(", ");

      return BadRequestError(message);
    }

    req.data = result.data;
    next();
  };
}
