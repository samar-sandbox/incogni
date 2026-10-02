import { createClient } from "redis";
import config from "../../config/config.js";

const client = createClient({ url: config.redisURL });

export async function connectRedis() {
  console.log(`Connecting to redis`);

  client.on("error", (err) => console.log("Redis Client Error", err));

  await client.connect();

  console.log("Redis connected successfully");
}

export async function set(key, value, ttl) {
  return client.set(key, value, {
    expiration: {
      type: "EX",
      value: ttl,
    },
  });
}

export async function get(key) {
  return client.get(key);
}

export async function setJson(key, value, ttl) {
  const jsonValue = JSON.stringify(value);
  return set(key, jsonValue, ttl);
}

export async function getJson(key) {
  const value = await get(key);
  if (!value) {
    return value;
  }
  return JSON.parse(value);
}

export async function del(key) {
  return client.del(key);
}

export async function exists(key) {
  const res = await client.exists(key);
  return res === 1;
}

export async function expire(key, seconds) {
  return client.expire(key, seconds);
}

export async function keys(prefix) {
  return client.keys(`${prefix}*`);
}
