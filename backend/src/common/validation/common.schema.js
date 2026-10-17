import { isValidObjectId } from "mongoose";
import { z } from "zod";

export const objectIdSchema = (message = "Invalid ObjectId format") =>
  z.string().refine((val) => isValidObjectId(val), {
    error: message,
  });

export const paginationSchema = (lang) =>
  z.object({
    page: z.coerce
      .number("Page must be a valid number")
      .int("Page must be a valid integer")
      .default(1),
    limit: z.coerce
      .number("Limit must be a valid number")
      .int("Limit must be a valid integer")
      .default(5),
  });

export const paginationQuerySchema = (lang) =>
  z.object({
    query: paginationSchema(lang),
  });
