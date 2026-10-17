import {
  BadRequestError,
  NotFoundError,
} from "../../common/exceptions/app.exception.js";
import { buildUserKey, del, keys } from "../../common/services/redis/index.js";
import { decrypt } from "../../common/services/security/index.js";
import { DbService, User } from "../../database/index.js";

const userRepo = new DbService(User);

export async function deleteUserResources(userId) {
  await userRepo.updateOne({ _id: userId }, { tokensValidAfter: new Date() });

  const userKeys = await keys(buildUserKey(userId));
  if (userKeys.length > 0) {
    await del(userKeys);
  }
}

export async function getUsers(userId) {
  const users = await userRepo.findMany(
    { _id: { $ne: userId } },
    { select: "-password" },
  );

  return {
    message: "Users retrieved successfully",
    data: users.map((user) => ({
      ...user,
      phone: user.phone ? decrypt(user.phone) : user.phone,
    })),
  };
}

export async function getProfile(userId) {
  const user = await userRepo.findById(userId, {
    select: "-password",
    lean: false,
  });

  if (!user) {
    return NotFoundError("User not found");
  }

  if (user.phone) {
    user.phone = decrypt(user.phone);
  }

  return {
    message: "Profile retrieved successfully",
    data: user,
  };
}

export async function uploadImages(userId, paths) {
  if (Object.keys(paths).length === 0) {
    throw BadRequestError("At least on image is required");
  }

  const user = await userRepo.findById(userId, { select: "image coverImages" });

  if (!user) {
    return NotFoundError("User not found");
  }

  const normalizePath = (path) => path.replaceAll("\\", "/");

  for (const [field, fieldPaths] of Object.entries(paths)) {
    paths[field] = fieldPaths.map((path) => normalizePath(path));
  }

  await userRepo.updateOne(
    { _id: userId },
    { ...paths, image: paths.image?.[0] },
  );

  return {
    message: "Files uploaded successfully",
    data: paths,
  };
}
