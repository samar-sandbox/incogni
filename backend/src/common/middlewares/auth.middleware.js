import config from "../../config/config.js";
import { USER_ROLE } from "../enums/user.enum.js";
import {
  decodeToken,
  ForbiddenError,
  InternalServerError,
  UnauthorizedError,
  verifyToken,
} from "../utils/index.js";

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

export function authentication(isAccessToken = true) {
  return function (req, res, next) {
    const [, token] = req.headers.authorization?.split(" ") ?? [];

    if (!token) {
      return UnauthorizedError("Token not found");
    }

    const { role } = decodeToken(token);

    const secret = getSecret(isAccessToken, role);

    try {
      const payload = verifyToken(token, secret);
      req.user = { ...payload, id: payload.sub };
      next();
    } catch (error) {
      return UnauthorizedError("Invalid token");
    }
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
