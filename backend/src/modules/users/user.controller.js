import { Router } from "express";
import {
  authentication,
  multerInstance,
  requiredRoles,
  upload,
} from "../../common/middlewares/index.js";
import { getProfile, getUsers, uploadImages } from "./user.service.js";
import { USER_ROLE } from "../../common/enums/user.enum.js";
import { FILE_TYPE } from "../../common/enums/file.enum.js";

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

router.post(
  "/upload",
  upload(
    multerInstance.fields([
      { name: "image", maxCount: 1 },
      { name: "coverImages", maxCount: 2 },
    ]),
    FILE_TYPE.IMAGE,
  ),
  async (req, res) => {
    const result = await uploadImages(req.user.id, req.paths);

    return res.status(200).json({ success: true, ...result });
  },
);

export default router;
