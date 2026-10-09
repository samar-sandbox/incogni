import { OAuth2Client } from "google-auth-library";
import config from "../../../config/config.js";
import { BadRequestError } from "../../exceptions/app.exception.js";

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
