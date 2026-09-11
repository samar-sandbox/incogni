function AppError(message, status) {
  throw new Error(message, { cause: { status } });
}

export function NotFoundError(message = "Resource not found") {
  return AppError(message, 404);
}

export function BadRequestError(message = "Bad request") {
  return AppError(message, 400);
}

export function UnauthorizedError(message = "Unauthorized") {
  return AppError(message, 401);
}

export function ForbiddenError(message = "Forbidden") {
  return AppError(message, 403);
}

export function ConflictError(message = "Conflict") {
  return AppError(message, 409);
}
