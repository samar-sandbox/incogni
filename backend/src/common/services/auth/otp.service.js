import { BadRequestError } from "../../exceptions/app.exception.js";
import { getOTP } from "../../utils/otp.js";
import { sendMail } from "../mail/mail.service.js";
import {
  buildOTPKeys,
  del,
  expire,
  get,
  getNum,
  incrBy,
  set,
  ttl,
} from "../redis/index.js";
import { compare, hash } from "../security/hashing.service.js";

export async function checkTrials(trialsKey, maxTrials) {
  const trials = await getNum(trialsKey);

  if (trials === maxTrials) {
    const remainingTime = await ttl(trialsKey);
    return BadRequestError(
      `Maximum trials exceeded. Please try again later in ${remainingTime} seconds.`,
    );
  }
}

export async function checkOTP(userId, subject, maxTrials) {
  const { otpKey, trialsKey } = buildOTPKeys(userId, subject);

  await checkTrials(trialsKey, maxTrials);

  const otp = await get(otpKey);

  return { otpKey, otp, trialsKey };
}

export async function createOTP(key, expiresIn) {
  const otp = getOTP();
  const hashedOtp = await hash(otp);

  await set(key, hashedOtp, expiresIn);

  return otp;
}

export async function sendOTP(
  { id, name, email },
  { subject, expiresIn = 3 * 60 },
) {
  const { otpKey } = buildOTPKeys(id, subject);

  const otp = await createOTP(otpKey, expiresIn);

  sendMail({ email, name, subject, otp });
}

export async function resendOTP(
  { id, name, email },
  { subject, maxTrials = 3, expiresIn = 3 * 60 },
) {
  const { otpKey, otp: currentOtp } = await checkOTP(id, subject, maxTrials);

  if (currentOtp) {
    return BadRequestError(
      "An OTP has already been sent. Please check your email.",
    );
  }

  const otp = await createOTP(otpKey, expiresIn);

  sendMail({ email, name, subject, otp });
}

export async function verifyOTP(
  { userId, otp },
  { subject, maxTrials = 3, bannedFor = 5 * 60, deleteKeys = true },
) {
  const {
    otpKey,
    otp: currentOtp,
    trialsKey,
  } = await checkOTP(userId, subject, maxTrials);

  if (!currentOtp) {
    return BadRequestError(
      "Invalid OTP. Please request a new one and try again.",
    );
  }

  const match = await compare(otp, currentOtp);
  if (!match) {
    const trials = await incrBy(trialsKey, 1);

    if (trials === maxTrials) {
      await expire(trialsKey, bannedFor);
    }

    return BadRequestError("Invalid OTP");
  }

  if (deleteKeys) {
    await del([otpKey, trialsKey]);
  }
}
