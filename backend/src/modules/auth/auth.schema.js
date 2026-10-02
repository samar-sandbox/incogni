import { z } from "zod";
import {
  LOGOUT_MODE,
  USER_GENDER,
  USER_ROLE,
} from "../../common/enums/index.js";
import { validationMessages } from "../../common/utils/translations.js";

export const registerSchema = (lang) =>
  z.object({
    body: z.object({
      name: z.string().min(3, validationMessages.name[lang]),
      email: z.email(validationMessages.email[lang]),
      password: z
        .string()
        .regex(
          /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{6,}$/,
          validationMessages.password.format[lang],
        ),
      phone: z
        .string()
        .regex(/^01[0125][0-9]{8}$/, validationMessages.phone[lang]),
      age: z.coerce
        .number()
        .int()
        .min(18, validationMessages.age.min[lang])
        .max(60, validationMessages.age.max[lang]),
      gender: z
        .enum(
          USER_GENDER,
          validationMessages.invalidEnumValue(
            "gender",
            Object.values(USER_GENDER),
          )[lang],
        )
        .optional(),
      role: z
        .enum(
          USER_ROLE,
          validationMessages.invalidEnumValue(
            "role",
            Object.entries(USER_ROLE).map(
              ([key, value]) => `${value} (${key})`,
            ),
          )[lang],
        )
        .default(USER_ROLE.USER),
    }),
  });

export const loginSchema = (lang) =>
  z.object({
    body: z.object({
      email: z.email(validationMessages.email[lang]),
      password: z.string().min(1, validationMessages.password.required[lang]),
    }),
  });

export const googleAuthSchema = (lang) =>
  z.object({
    body: z.object({
      credential: z.string().min(1, validationMessages.googleId[lang]),
      clientId: z.string().optional(),
    }),
  });

export const logoutSchema = (lang) =>
  z.object({
    query: z.object({
      mode: z
        .enum(
          LOGOUT_MODE,
          validationMessages.invalidEnumValue(
            "mode",
            Object.entries(LOGOUT_MODE).map(
              ([key, value]) => `${value} (${key})`,
            ),
          )[lang],
        )
        .default(LOGOUT_MODE.DEVICE),
    }),
  });
