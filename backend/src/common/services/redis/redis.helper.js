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

export function buildOTPKeys(userId, subject) {
  const otpKey = buildUserKey(userId, `OTP:${subject}`);
  const trialsKey = `${otpKey}:trials`;

  return { otpKey, trialsKey };
}

export function buildLoginKey(userId) {
  return buildUserKey(userId, "login:trials");
}
