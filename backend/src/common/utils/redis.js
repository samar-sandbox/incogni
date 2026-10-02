export function buildUserKey(userId, prefix) {
  let key = `user:${userId}`;

  if (prefix) {
    key += `:${prefix}`;
  }

  return key;
}

export function buildRevokeKey(userId, jti) {
  return buildUserKey(userId, `revoke:${jti}`);
}
