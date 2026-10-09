import { Router } from "express";
import {
  confirmEmail,
  enableTwoStepVerification,
  forgotPassword,
  handleGoogleAuth,
  login,
  logout,
  refreshTokens,
  resendEmail,
  resetPassword,
  signup,
  twoStepVerification,
  verifyLogin,
  verifyPasswordOTP,
} from "./auth.service.js";
import { authentication, validation } from "../../common/middlewares/index.js";
import {
  verifyOTPSchema,
  googleAuthSchema,
  loginSchema,
  logoutSchema,
  registerSchema,
  sendOTPSchema,
  resetPasswordSchema,
} from "./auth.schema.js";

const router = Router();

// Google Auth
router.post("/google", validation(googleAuthSchema), async (req, res) => {
  const { isNew, ...result } = await handleGoogleAuth(req.data.body);

  return res.status(isNew ? 201 : 200).json({ success: true, ...result });
});

// Signup
router.post("/signup", validation(registerSchema), async (req, res) => {
  const result = await signup(req.data.body);

  return res.status(201).json({ success: true, ...result });
});

// Login
router.post("/login", validation(loginSchema), async (req, res) => {
  const result = await login(req.data.body);

  return res.status(200).json({ success: true, ...result });
});

// Verify Login - Two-Step Verification
router.post("/verify-login", validation(verifyOTPSchema), async (req, res) => {
  const result = await verifyLogin(req.data.body);

  return res.status(200).json({ success: true, ...result });
});

// Refresh Token
router.post("/refresh-token", authentication(false), async (req, res) => {
  const result = await refreshTokens(req.user);

  return res.status(200).json({ success: true, ...result });
});

// Logout
router.post(
  "/logout",
  authentication(),
  validation(logoutSchema),
  async (req, res) => {
    const result = await logout(req.user, req.data.query.mode);

    return res.status(200).json({ success: true, ...result });
  },
);

// Confirm Email
router.post("/confirm-email", validation(verifyOTPSchema), async (req, res) => {
  const result = await confirmEmail(req.data.body);

  return res.status(200).json({ success: true, ...result });
});

// Resend Email Confirmation OTP
router.post("/resend-email", validation(sendOTPSchema), async (req, res) => {
  const result = await resendEmail(req.data.body);

  return res.status(200).json({ success: true, ...result });
});

// Request OTP to reset password
router.post("/forgot-password", validation(sendOTPSchema), async (req, res) => {
  const result = await forgotPassword(req.data.body);

  return res.status(200).json({ success: true, ...result });
});

// Reset Password OTP Verification
router.post(
  "/forgot-password-verify",
  validation(verifyOTPSchema),
  async (req, res) => {
    const result = await verifyPasswordOTP(req.data.body);

    return res.status(200).json({ success: true, ...result });
  },
);

// Reset Password
router.post(
  "/reset-password",
  validation(resetPasswordSchema),
  async (req, res) => {
    const result = await resetPassword(req.data.body);

    return res.status(200).json({ success: true, ...result });
  },
);

// Request OTP to enable two-step verification
router.post(
  "/two-step-verification",
  validation(sendOTPSchema),
  async (req, res) => {
    const result = await twoStepVerification(req.data.body);

    return res.status(200).json({ success: true, ...result });
  },
);

// Verify OTP and enable Two-Step Verification
router.post(
  "/enable-two-step-verification",
  validation(verifyOTPSchema),
  async (req, res) => {
    const result = await enableTwoStepVerification(req.data.body);

    return res.status(200).json({ success: true, ...result });
  },
);

export default router;
