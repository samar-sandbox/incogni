import { NotFoundError } from "../../common/utils/app-error.js";
import { decrypt } from "../../common/utils/encryption.js";
import { DbService, User } from "../../database/index.js";

const userRepo = new DbService(User);

export async function getUsers(userId) {
  const users = await userRepo.findMany(
    { _id: { $ne: userId } },
    { select: "-password" },
  );

  return {
    message: "Users retrieved successfully",
    data: users.map((user) => ({ ...user, phone: decrypt(user.phone) })),
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
