import dotenv from "dotenv";

dotenv.config();

export default {
  dbURI: process.env.DB_URI || "mongodb://localhost:27017/incogni",
  port: process.env.PORT || 3000,
  encryptionKey:
    process.env.ENCRYPTION_KEY ||
    "756af612cae2ede2a970c1901cff95e486e854587dae67f7fb7752c1ad1b24d9",
};
