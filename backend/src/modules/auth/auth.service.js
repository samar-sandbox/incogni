import { compare, decrypt, encrypt, hash } from "../../utils/index.js";
import { DbService, User } from "../../database/index.js";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "../../utils/app-error.js";

const userRepo = new DbService(User);

async function checkUserEmail(email, id) {
  const user = await userRepo.exists({ email });

  if (!user || (id && user._id.equals(id))) {
    return { success: true };
  }

  return ConflictError("Email already exists");
}

export async function signup(userData) {
  if (!userData) {
    return BadRequestError("Invalid user data");
  }

  const { name, email, password, phone } = userData;

  // Validate before hashing the password and encrypting the phone number
  const [firstName] = name.split(" ") || "";
  await userRepo.validate({
    ...userData,
    firstName,
  });

  if (email) {
    await checkUserEmail(email);
  }

  const hashedPassword = await hash(password);
  const encryptedPhone = encrypt(phone);

  const user = await userRepo.create(
    {
      ...userData,
      password: hashedPassword,
      phone: encryptedPhone,
    },
    {
      // already validated before password hashing and phone encryption
      // phone won't pass the validation after encryption
      validateBeforeSave: false,
    },
  );

  return { message: "User created successfully", data: { _id: user._id } };
}

export async function login(userData) {
  if (!userData) {
    return BadRequestError("Invalid user data");
  }

  const { email, password } = userData;

  const user = await userRepo.findOne({ email }, { lean: false });
  if (!user) {
    return UnauthorizedError("Invalid email or password");
  }

  const userObj = user.toObject();
  const { password: userPassword, phone: userPhone, ...data } = userObj;

  const match = await compare(password, userPassword);
  if (!match) {
    return UnauthorizedError("Invalid email or password");
  }

  const phone = decrypt(userPhone);

  return { message: "User logged in successfully", data: { ...data, phone } };
}
