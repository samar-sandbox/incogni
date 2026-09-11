import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import config from "../config/config.js";

const ALGORITHM = "aes-256-cbc";
const KEY = Buffer.from(config.encryptionKey, "hex");

export function encrypt(text) {
  const iv = randomBytes(16);
  const ivHex = iv.toString("hex");

  const cipher = createCipheriv(ALGORITHM, KEY, iv);

  let result = cipher.update(text, "utf-8", "hex");
  result += cipher.final("hex");

  return `${ivHex}:${result}`;
}

export function decrypt(text) {
  const [ivHex, encrypted] = text.split(":");

  const iv = Buffer.from(ivHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, KEY, iv);

  let result = decipher.update(encrypted, "hex", "utf-8");
  result += decipher.final("utf-8");

  return result;
}
