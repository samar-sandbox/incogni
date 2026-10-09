import { DbService, User } from "../../database/index.js";
import {
  AUTH_PROVIDER,
  LOGOUT_MODE,
  MAIL_DETAILS,
  MAIL_SUBJECT,
  USER_ROLE,
} from "../../common/enums/index.js";
import config from "../../config/config.js";
import {
  checkTrials,
  getTokens,
  resendOTP,
  sendOTP,
  verifyGoogleIdToken,
  verifyOTP,
} from "../../common/services/auth/index.js";
import {
  buildLoginKey,
  buildRevokeKey,
  expire,
  incrBy,
  set,
} from "../../common/services/redis/index.js";
import {
  BadRequestError,
  ConflictError,
} from "../../common/exceptions/app.exception.js";
import {
  encrypt,
  hash,
  compare,
} from "../../common/services/security/index.js";
import { deleteUserResources } from "../users/user.service.js";

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

  const subject = MAIL_SUBJECT.CONFIRMATION;
  const expiresIn = MAIL_DETAILS[subject].expiresIn;

  sendOTP(
    { id: newUser._id, email, name: newUser.name },
    { subject, expiresIn },
  );

  return { message: "User created successfully", data: { _id: newUser._id } };
}

export async function login(userData) {
  const { email, password } = userData;

  const user = await userRepo.findOne({ email }, { lean: false });
  if (!user) {
    return BadRequestError("Invalid email or password");
  }

  if (!user.emailConfirmed) {
    return BadRequestError(
      "Email is not confirmed. Please confirm your email before logging in.",
    );
  }

  const {
    password: userPassword,
    _id,
    name,
    role = USER_ROLE.USER,
    provider = AUTH_PROVIDER.LOCAL,
  } = user;

  const maxTrials = 5;
  const bannedFor = 5 * 60;
  const trialsKey = buildLoginKey(_id);

  await checkTrials(trialsKey, maxTrials);

  if (provider !== AUTH_PROVIDER.LOCAL) {
    return BadRequestError("Invalid email or password");
  }

  const match = await compare(password, userPassword);
  if (!match) {
    const trials = await incrBy(trialsKey, 1);

    if (trials === maxTrials) {
      await expire(trialsKey, bannedFor);
    }

    return BadRequestError("Invalid email or password");
  }

  if (user.twoStepVerificationEnabled === true) {
    const subject = MAIL_SUBJECT.VERIFICATION;
    const expiresIn = MAIL_DETAILS[subject].expiresIn;

    sendOTP({ id: _id, email, name }, { subject, expiresIn });

    return {
      message: "Two-Step Verification OTP sent successfully",
      twoStepVerificationEnabled: true,
    };
  }

  const tokens = getTokens({ sub: _id, role }, role);

  return {
    message: "User logged in successfully",
    data: tokens,
    twoStepVerificationEnabled: false,
  };
}

export async function verifyLogin({ email, otp }) {
  const user = await userRepo.findOne(
    { email },
    { select: "_id role twoStepVerificationEnabled" },
  );

  if (!user) {
    return BadRequestError("Invalid credentials");
  }

  if (!user.twoStepVerificationEnabled) {
    return BadRequestError(
      "Two-Step Verification is not enabled for this user",
    );
  }

  const subject = MAIL_SUBJECT.VERIFICATION;
  const { maxTrials, bannedFor } = MAIL_DETAILS[subject];

  await verifyOTP({ userId: user._id, otp }, { subject, maxTrials, bannedFor });

  const tokens = getTokens({ sub: user._id, role: user.role }, user.role);

  return { message: "User logged in successfully", data: tokens };
}

export async function resendLogin({ email }) {
  const user = await userRepo.findOne(
    { email },
    {
      select: "_id email twoStepVerificationEnabled firstName lastName",
      lean: false,
    },
  );

  if (!user) {
    return BadRequestError("Invalid credentials");
  }

  if (!user.twoStepVerificationEnabled) {
    return BadRequestError(
      "Two-Step Verification is not enabled for this user",
    );
  }

  const subject = MAIL_SUBJECT.VERIFICATION;
  const { maxTrials, expiresIn } = MAIL_DETAILS[subject];

  await resendOTP(
    { id: user._id, name: user.name, email: user.email },
    { subject, maxTrials, expiresIn },
  );

  return { message: "Login OTP sent successfully" };
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

export async function logout(user, mode) {
  if (mode === LOGOUT_MODE.ALL) {
    await deleteUserResources(user.id);

    return { message: "User logged out successfully" };
  }

  const key = buildRevokeKey(user.id, user.jti);
  const ttl =
    config.jwtExpiresIn.refreshKey - (Math.floor(Date.now() / 1000) - user.iat);

  if (ttl > 0) {
    await set(key, user.jti, ttl);
  }

  return { message: "User logged out successfully" };
}

export async function confirmEmail({ email, otp }) {
  const user = await userRepo.findOne(
    { email },
    { select: "_id emailConfirmed" },
  );

  if (!user) {
    return BadRequestError("Invalid credentials");
  }

  if (user.emailConfirmed === true) {
    return BadRequestError("Email is already confirmed");
  }

  const subject = MAIL_SUBJECT.CONFIRMATION;
  const { maxTrials, bannedFor } = MAIL_DETAILS[subject];

  await verifyOTP({ userId: user._id, otp }, { subject, maxTrials, bannedFor });

  await userRepo.updateOne({ _id: user._id }, { emailConfirmed: true });

  return { message: "Email confirmed successfully" };
}

export async function resendEmail({ email }) {
  const user = await userRepo.findOne(
    { email },
    { select: "_id email emailConfirmed firstName lastName", lean: false },
  );

  if (!user) {
    return BadRequestError("Invalid credentials");
  }

  if (user.emailConfirmed === true) {
    return BadRequestError("Email is already confirmed");
  }

  const subject = MAIL_SUBJECT.CONFIRMATION;
  const { maxTrials, expiresIn } = MAIL_DETAILS[subject];

  await resendOTP(
    { id: user._id, name: user.name, email: user.email },
    { subject, maxTrials, expiresIn },
  );

  return { message: "Email confirmation sent successfully" };
}

export async function forgotPassword({ email }) {
  const user = await userRepo.findOne(
    { email },
    { select: "_id email emailConfirmed firstName lastName", lean: false },
  );

  if (!user) {
    return BadRequestError("Invalid credentials");
  }

  if (!user.emailConfirmed) {
    return BadRequestError(
      "Email is not confirmed. Please confirm your email before resetting password.",
    );
  }

  const subject = MAIL_SUBJECT.RESET_PASSWORD;
  const { maxTrials, expiresIn } = MAIL_DETAILS[subject];

  await resendOTP(
    { id: user._id, name: user.name, email },
    { subject, maxTrials, expiresIn },
  );

  return { message: "Password reset OTP sent successfully" };
}

export async function verifyPasswordOTP({ email, otp }, returnId = false) {
  const user = await userRepo.findOne(
    { email },
    { select: "_id emailConfirmed" },
  );

  if (!user) {
    return BadRequestError("Invalid credentials");
  }

  if (!user.emailConfirmed) {
    return BadRequestError(
      "Email is not confirmed. Please confirm your email before resetting password.",
    );
  }

  const subject = MAIL_SUBJECT.RESET_PASSWORD;
  const { maxTrials, bannedFor } = MAIL_DETAILS[subject];

  await verifyOTP(
    { userId: user._id, otp },
    { subject, maxTrials, bannedFor, deleteKeys: false },
  );

  return {
    message: "Password reset OTP verified successfully",
    userId: returnId ? user._id : undefined,
  };
}

export async function resetPassword({ email, otp, password }) {
  const { userId } = await verifyPasswordOTP({ email, otp }, true);

  const hashedPassword = await hash(password);
  await userRepo.updateOne({ email }, { password: hashedPassword });

  await deleteUserResources(userId);

  return { message: "Password reset successfully" };
}

export async function twoStepVerification({ email }) {
  const user = await userRepo.findOne(
    { email },
    {
      select: "_id email twoStepVerificationEnabled firstName lastName",
      lean: false,
    },
  );

  if (!user) {
    return BadRequestError("Invalid credentials");
  }

  if (user.twoStepVerificationEnabled === true) {
    return BadRequestError("Two-Step Verification is already enabled");
  }

  const subject = MAIL_SUBJECT.VERIFICATION;
  const { maxTrials, expiresIn } = MAIL_DETAILS[subject];

  await resendOTP(
    { id: user._id, name: user.name, email: user.email },
    { subject, maxTrials, expiresIn },
  );

  return { message: "Two-Step Verification OTP sent successfully" };
}

export async function enableTwoStepVerification({ email, otp }) {
  const user = await userRepo.findOne(
    { email },
    { select: "_id twoStepVerificationEnabled", lean: false },
  );

  if (!user) {
    return BadRequestError("Invalid credentials");
  }

  if (user.twoStepVerificationEnabled === true) {
    return BadRequestError("Two-Step Verification is already enabled");
  }

  const subject = MAIL_SUBJECT.VERIFICATION;
  const { maxTrials, bannedFor } = MAIL_DETAILS[subject];

  await verifyOTP({ userId: user._id, otp }, { subject, maxTrials, bannedFor });

  await userRepo.updateOne(
    { _id: user._id },
    {
      twoStepVerificationEnabled: true,
      emailConfirmed: true, // Mark email as confirmed when enabling two-step verification
    },
  );

  return { message: "Two-Step Verification enabled successfully" };
}
