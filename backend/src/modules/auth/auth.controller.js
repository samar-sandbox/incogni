import { Router } from "express";
import {
  handleGoogleAuth,
  login,
  refreshTokens,
  signup,
} from "./auth.service.js";
import { authentication, validation } from "../../common/middlewares/index.js";
import {
  googleAuthSchema,
  loginSchema,
  registerSchema,
} from "./auth.schema.js";

const router = Router();

// Google Auth
router.post("/google", validation(googleAuthSchema), async (req, res) => {
  const { isNew, ...result } = await handleGoogleAuth(req.data);

  return res.status(isNew ? 201 : 200).json({ success: true, ...result });
});

// Signup
router.post("/signup", validation(registerSchema), async (req, res) => {
  const result = await signup(req.data);

  return res.status(201).json({ success: true, ...result });
});

// Login
router.post("/login", validation(loginSchema), async (req, res) => {
  const result = await login(req.data);

  return res.status(200).json({ success: true, ...result });
});

// Refresh Token
router.post("/refresh-token", authentication(false), async (req, res) => {
  const result = await refreshTokens(req.user);

  return res.status(200).json({ success: true, ...result });
});

export default router;
