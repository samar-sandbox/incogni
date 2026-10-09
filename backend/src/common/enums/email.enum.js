export const MAIL_SUBJECT = {
  CONFIRMATION: "CONFIRMATION",
  RESET_PASSWORD: "RESET_PASSWORD",
  VERIFICATION: "VERIFICATION",
};

export const MAIL_DETAILS = {
  [MAIL_SUBJECT.CONFIRMATION]: {
    title: "Confirm your email",
    expiresIn: 3 * 60,
    bannedFor: 5 * 60,
    maxTrials: 3,
  },
  [MAIL_SUBJECT.RESET_PASSWORD]: {
    title: "Reset your password",
    expiresIn: 3 * 60,
    bannedFor: 5 * 60,
    maxTrials: 3,
  },
  [MAIL_SUBJECT.VERIFICATION]: {
    title: "Verify it's you",
    expiresIn: 3 * 60,
    bannedFor: 5 * 60,
    maxTrials: 3,
  },
};
