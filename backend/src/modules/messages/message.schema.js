import { z } from "zod";
import {
  MESSAGE_REQUEST,
  SELECT_MODE,
} from "../../common/enums/message.enum.js";
import {
  objectIdSchema,
  paginationSchema,
} from "../../common/validation/common.schema.js";

export const getQuerySchema = (lang) =>
  z.object({
    query: z.object({
      mode: z
        .enum(
          SELECT_MODE,
          "Invalid enum value for request `mode`: sent, received",
        )
        .default(SELECT_MODE.RECEIVED),
      ...paginationSchema(lang).shape,
    }),
  });

export const messageSchema = (lang) =>
  z
    .object({
      body: z.object({
        content: z
          .string()
          .min(10, "Content must be at least 10 characters long")
          .max(500, "Content must be less than 500 characters long"),
        receiverId: objectIdSchema("Invalid receiver ID"),
      }),
      files: z.object({
        attachments: z.array(z.string()).default([]),
      }),
    })
    .refine(
      ({ body, files }) =>
        body.content.length > 0 || files.attachments.length > 0,
      {
        error: "At least content or file is required",
        path: "content",
      },
    );

export const createRequestSchema = (lang) =>
  z.object({
    params: z.object({
      messageId: objectIdSchema("Invalid message ID"),
    }),
  });

const requestParamsSchema = z.object({
  requestId: objectIdSchema("Invalid request ID"),
});

export const updateRequestSchema = (lang) =>
  z.object({
    body: z.object({
      status: z
        .enum(
          MESSAGE_REQUEST,
          "Invalid enum value for request `status`: pending, canceled, rejected, and accepted",
        )
        .default(MESSAGE_REQUEST.PENDING),
    }),
    params: requestParamsSchema,
  });

export const requestSchema = (lang) =>
  z.object({
    params: requestParamsSchema,
  });

const conversationParamsSchema = z.object({
  conversationId: objectIdSchema("Invalid conversation ID"),
});

export const conversationSchema = (lang) =>
  z.object({
    params: conversationParamsSchema,
  });

export const conversationMessageSchema = (lang) =>
  z.object({
    body: z.object({
      content: z.string().nonempty("Content is required"),
      attachments: z.array(z.string()).default([]),
    }),
    params: conversationParamsSchema,
  });
