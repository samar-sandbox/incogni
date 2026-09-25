import dotenv from "dotenv";

dotenv.config();

export default {
  dbURI: process.env.DB_URI || "mongodb://localhost:27017/incogni",
  port: process.env.PORT || 3000,
  encryptionKey:
    process.env.ENCRYPTION_KEY ||
    "756af612cae2ede2a970c1901cff95e486e854587dae67f7fb7752c1ad1b24d9",
  userJwtKeys: {
    accessKey: process.env.USER_ACCESS_TOKEN_KEY,
    refreshKey: process.env.USER_REFRESH_TOKEN_KEY,
  },
  adminJwtKeys: {
    accessKey: process.env.ADMIN_ACCESS_TOKEN_KEY,
    refreshKey: process.env.ADMIN_REFRESH_TOKEN_KEY,
  },
  jwtExpiresIn: {
    accessKey: parseInt(process.env.JWT_ACCESS_EXPIRES_IN) || 15 * 60, // 15 min
    refreshKey: parseInt(process.env.JWT_REFRESH_EXPIRES_IN) || 24 * 60 * 60, // 1 day
  },
  googleClient: {
    secret: process.env.GOOGLE_CLIENT_SECRET,
    webIds: (process.env.GOOGLE_CLIENT_IDS || "").split(","),
  },
};
