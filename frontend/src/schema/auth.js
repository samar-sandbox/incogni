import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Email must be a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters long"),
    email: loginSchema.shape.email,
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string(),
    phone: z
      .string()
      .regex(
        /^01[0125][0-9]{8}$/,
        "Enter a valid Egyptian number (010/011/012/015 + 8 digits)",
      ),
    age: z
      .number()
      .min(18, "Age must be at least 18")
      .max(60, "Age must be at most 60")
      .optional(),
    gender: z.enum(["male", "female"]),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });
