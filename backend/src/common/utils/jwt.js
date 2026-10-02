import jwt from "jsonwebtoken";
import config from "../../config/config.js";

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
