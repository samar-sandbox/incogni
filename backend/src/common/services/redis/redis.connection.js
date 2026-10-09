import { createClient } from "redis";
import config from "../../../config/config.js";

export const client = createClient({ url: config.redisURL });

export async function connectRedis() {
  console.log(`Connecting to redis...`);

  client.on("error", (err) => console.log("Redis Client Error", err));

  await client.connect();

  console.log("Redis connected successfully");
}
