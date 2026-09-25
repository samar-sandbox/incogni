import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import config from "../../config/config.js";
import { USER_ROLE } from "../enums/user.enum.js";
import { BadRequestError } from "./app-error.js";

const defaultOptions = {
  //   audience: "",
  //   issuer: "",
};

/**
 *
 * @param {object} payload
 * @param {string} secret
 * @param {import('jsonwebtoken').SignOptions} options
 * @returns {string} The JSON Web Token string
 */
export function signToken(
  payload,
  secret = config.userJwtKeys.accessKey,
  options = {
    expiresIn: config.jwtExpiresIn.accessKey,
  },
) {
  return jwt.sign(payload, secret, {
    ...defaultOptions,
    ...options,
  });
}

/**
 *
 * @param {string} token
 * @param {string} secret
 * @param {import("jsonwebtoken").VerifyOptions} options
 * @returns {import("jsonwebtoken").JwtPayload} The decoded token.
 */
export function verifyToken(
  token,
  secret = config.userJwtKeys.accessKey,
  options = {
    ...defaultOptions,
    complete: false,
  },
) {
  return jwt.verify(token, secret, options);
}

/**
 *
 * @param {string} token
 * @param {import("jsonwebtoken").DecodeOptions} options
 * @returns {import("jsonwebtoken").JwtPayload} The decoded token.
 */
export function decodeToken(token, options = { json: true }) {
  return jwt.decode(token, options);
}

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

  const accessToken = signToken(payload, accessKey);
  const refreshToken = signToken(payload, refreshKey, {
    expiresIn: config.jwtExpiresIn.refreshKey,
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
