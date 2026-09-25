import { Router } from "express";
import {
  authentication,
  requiredRoles,
} from "../../common/middlewares/auth.middleware.js";
import { getProfile, getUsers } from "./user.service.js";
import { USER_ROLE } from "../../common/enums/user.enum.js";

const router = Router();

router.use(authentication());

router.get("/all", requiredRoles([USER_ROLE.ADMIN]), async (req, res) => {
  const result = await getUsers(req.user.id);

  return res.status(200).json({ success: true, ...result });
});

router.get("/profile", async (req, res) => {
  const result = await getProfile(req.user.id);

  return res.status(200).json({ success: true, ...result });
});

export default router;
