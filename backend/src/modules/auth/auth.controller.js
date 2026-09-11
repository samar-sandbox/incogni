import { Router } from "express";
import { login, signup } from "./auth.service.js";

const router = Router();

// Signup
router.post("/signup", async (req, res) => {
  const userData = req.body;

  const result = await signup(userData);

  return res.status(201).json({ success: true, ...result });
});

// Login
router.post("/login", async (req, res) => {
  const userData = req.body;

  const result = await login(userData);

  return res.status(200).json({ success: true, ...result });
});

export default router;
