import { client } from "./redis.connection.js";

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

export async function getNum(key) {
  const value = await get(key);
  return value ? parseInt(value) : 0;
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

export async function incrBy(key, increment = 1) {
  return client.incrBy(key, increment);
}

export async function ttl(key) {
  return client.ttl(key);
}
