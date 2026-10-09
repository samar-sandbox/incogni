import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { USER_ROLE } from "../../enums/user.enum.js";
import config from "../../../config/config.js";

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
function signToken(
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

  const jwtid = randomUUID();

  const accessToken = signToken(payload, accessKey, { jwtid });
  const refreshToken = signToken(payload, refreshKey, {
    expiresIn: config.jwtExpiresIn.refreshKey,
    jwtid,
  });

  return { accessToken, refreshToken };
}
