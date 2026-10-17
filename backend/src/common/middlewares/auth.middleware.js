import config from "../../config/config.js";
import { DbService, User } from "../../database/index.js";
import { USER_ROLE } from "../enums/user.enum.js";
import {
  ForbiddenError,
  InternalServerError,
  UnauthorizedError,
} from "../exceptions/app.exception.js";
import { verifyToken, decodeToken } from "../services/auth/jwt.service.js";
import { buildRevokeKey, exists } from "../services/redis/index.js";

const userRepo = new DbService(User);

function getSecret(isAccessToken, role) {
  const key = isAccessToken ? "accessKey" : "refreshKey";

  switch (role) {
    case USER_ROLE.ADMIN:
      return config.adminJwtKeys[key];
    case USER_ROLE.USER:
    default:
      return config.userJwtKeys[key];
  }
}

async function checkToken(payload, user) {
  if (
    user.tokensValidAfter &&
    Math.floor(new Date(user.tokensValidAfter).getTime() / 1000) >= payload.iat
  ) {
    return { success: false };
  }

  const key = buildRevokeKey(payload.sub, payload.jti);
  const exist = await exists(key);

  return { success: !exist };
}

export function authentication(isAccessToken = true, isOptional = false) {
  return async function (req, res, next) {
    const [, token] = req.headers.authorization?.split(" ") ?? [];

    if (!token) {
      if (isOptional) {
        return next();
      }

      return UnauthorizedError("Token not found");
    }

    let payload;
    try {
      const { role } = decodeToken(token);

      const secret = getSecret(isAccessToken, role);

      payload = verifyToken(token, secret);
    } catch (error) {
      console.log(
        "🚀 ~ auth.middleware.js:56 ~ authentication ~ error:",
        error,
      );

      return UnauthorizedError("Invalid token");
    }

    const user = await userRepo.findById(payload.sub, {
      select: "tokensValidAfter",
    });
    if (!user) {
      return UnauthorizedError("Invalid token");
    }

    const { success } = await checkToken(payload, user);
    if (!success) {
      return UnauthorizedError("Invalid token: token expired");
    }

    req.user = { ...payload, id: payload.sub };
    next();
  };
}

export function requiredRoles(roles = [USER_ROLE.USER]) {
  return function (req, res, next) {
    const user = req.user;

    if (!user) {
      return InternalServerError("Missing user payload");
    }

    if (!roles.includes(user.role)) {
      return ForbiddenError();
    }

    next();
  };
}
