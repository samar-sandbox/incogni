import { z } from "zod";
import {
  objectIdSchema,
  paginationSchema,
} from "../../common/validation/common.schema.js";

const conversationParamsSchema = z.object({
  conversationId: objectIdSchema("Invalid conversation ID"),
});

export const conversationSchema = (lang) =>
  z.object({
    params: conversationParamsSchema,
    query: paginationSchema(lang),
  });

export const conversationMessageSchema = (lang) =>
  z
    .object({
      body: z.object({
        content: z.string().nonempty("Content is required"),
      }),
      files: z.object({
        attachments: z.array(z.string()).default([]),
      }),
      params: conversationParamsSchema,
    })
    .refine(
      ({ body, files }) =>
        body.content.length > 0 || files.attachments.length > 0,
      {
        error: "At least content or file is required",
        path: "content",
      },
    );
