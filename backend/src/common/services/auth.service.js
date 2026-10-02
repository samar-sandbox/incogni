import { signToken } from "../utils/jwt.js";
import { randomUUID } from "node:crypto";
import { USER_ROLE } from "../enums/user.enum.js";
import { OAuth2Client } from "google-auth-library";
import { BadRequestError } from "../utils/app-error.js";
import config from "../../config/config.js";

function getSecrets(role) {
  switch (role) {
    case USER_ROLE.ADMIN:
      return config.adminJwtKeys;
    case USER_ROLE.USER:
    default:
      return config.userJwtKeys;
  }
}

/**
 *
 * @param {object} payload
 * @param {number} role
 * @returns {{ accessToken: string, refreshToken: string }} Access and refresh tokens based on the role
 */
export function getTokens(payload, role = USER_ROLE.USER) {
  const { accessKey, refreshKey } = getSecrets(role);

  const jwtid = randomUUID();

  const accessToken = signToken(payload, accessKey, { jwtid });
  const refreshToken = signToken(payload, refreshKey, {
    expiresIn: config.jwtExpiresIn.refreshKey,
    jwtid,
  });

  return { accessToken, refreshToken };
}

/**
 *
 * @param {string} token Google ID token to verify
 * @returns the token payload
 */
export async function verifyGoogleIdToken(token) {
  const client = new OAuth2Client();

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: config.googleClient.webIds,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    return BadRequestError("Invalid credentials");
  }

  const { email, email_verified, name, picture } = payload;

  if (!email_verified) {
    return BadRequestError("Unverified email address");
  }

  return { email, name, image: picture };
}
