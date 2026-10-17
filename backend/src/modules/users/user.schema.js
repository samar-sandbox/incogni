import { z } from "zod";

export const uploadImagesSchema = (lang) =>
  z.object({
    files: z.object({
      coverImages: z.array(z.string()).optional(),
      image: z.array(z.string()).optional(),
    }),
  });
