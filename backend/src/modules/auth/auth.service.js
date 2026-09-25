import { DbService, User } from "../../database/index.js";
import {
  BadRequestError,
  ConflictError,
  compare,
  encrypt,
  getTokens,
  hash,
  verifyGoogleIdToken,
} from "../../common/utils/index.js";
import { AUTH_PROVIDER, USER_ROLE } from "../../common/enums/index.js";
import config from "../../config/config.js";

const userRepo = new DbService(User);

export async function signup(userData) {
  const { email, password, phone } = userData;

  const user = await userRepo.exists({ email });
  if (user) {
    return ConflictError("Email already exists");
  }

  const hashedPassword = await hash(password);
  const encryptedPhone = encrypt(phone);

  const newUser = await userRepo.create(
    {
      ...userData,
      password: hashedPassword,
      phone: encryptedPhone,
      provider: AUTH_PROVIDER.LOCAL,
    },
    {
      // already validated before password hashing and phone encryption
      // phone won't pass the validation after encryption
      validateBeforeSave: false,
    },
  );

  return { message: "User created successfully", data: { _id: newUser._id } };
}

export async function login(userData) {
  const { email, password } = userData;

  const user = await userRepo.findOne({ email });
  if (!user) {
    return BadRequestError("Invalid email or password");
  }

  const {
    password: userPassword,
    _id,
    role = USER_ROLE.USER,
    provider = AUTH_PROVIDER.LOCAL,
  } = user;

  if (provider !== AUTH_PROVIDER.LOCAL) {
    return BadRequestError("Invalid email or password");
  }

  const match = await compare(password, userPassword);
  if (!match) {
    return BadRequestError("Invalid email or password");
  }

  const tokens = getTokens({ sub: _id, role }, role);

  return { message: "User logged in successfully", data: tokens };
}

export async function refreshTokens(userPayload) {
  const { sub, role, iat } = userPayload;

  const elapsedSec = Math.floor(Date.now() / 1000) - iat;

  if (elapsedSec < config.jwtExpiresIn.accessKey) {
    return BadRequestError("Cannot refresh access token before expiration");
  }

  const tokens = getTokens({ sub, role }, role);

  return { message: "Tokens refreshed successfully", data: tokens };
}

export async function handleGoogleAuth({ credential }) {
  const { email, name, image } = await verifyGoogleIdToken(credential);

  const user = await userRepo.findOne({ email });

  let sub,
    isNew = true;
  if (!user) {
    const [firstName, lastName] = (name || "").split(" ");
    const newUser = await userRepo.create({
      firstName,
      lastName,
      email,
      image,
      provider: AUTH_PROVIDER.GOOGLE,
      emailConfirmed: true,
    });

    sub = newUser._id;
  } else if (user.provider !== AUTH_PROVIDER.GOOGLE) {
    return ConflictError(
      "An account already exists with this email, log in with your password instead",
    );
  } else {
    sub = user._id;
    isNew = false;
  }

  const role = USER_ROLE.USER;
  const tokens = getTokens({ sub, role }, role);

  return {
    message: `User ${isNew ? "created" : "logged in"} successfully`,
    data: tokens,
    isNew,
  };
}
