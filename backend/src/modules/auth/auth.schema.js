import { z } from "zod";
import { USER_GENDER, USER_ROLE } from "../../common/enums/index.js";

export const registerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  email: z.email("Email must be a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  phone: z
    .string()
    .regex(
      /^01[0125][0-9]{8}$/,
      "Phone number must be a valid Egyptian number starting with 010, 011, 012, or 015 and followed by 8 digits",
    )
    .optional(),
  age: z.coerce
    .number()
    .int()
    .min(18, "Age must be at least 18 years old")
    .max(60, "Age must be at most 60 years old")
    .optional(),
  gender: z
    .enum(
      Object.values(USER_GENDER),
      "Invalid enum value for path `gender`: 'male' or 'female'",
    )
    .optional(),
  role: z
    .enum(
      Object.values(USER_ROLE),
      "valid enum value for path `role`: 0 (user) or 1 (admin)",
    )
    .optional(),
});

export const loginSchema = z.object({
  email: z.email("Email must be a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1, "Google ID token is required"),
  clientId: z.string().optional(),
});
