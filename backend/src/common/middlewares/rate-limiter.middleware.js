import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import geoip from "geoip-lite";
import { client } from "../services/redis/redis.connection.js";

class RedisStore {
  constructor({ redisClient } = {}) {
    this.client = redisClient;
  }

  async init(options) {
    this.window = options.windowMs / 1000;
  }

  async get(key) {
    const [hits, ttl] = await this.client.multi().get(key).ttl(key).exec();

    if (!hits) {
      return undefined;
    }

    return {
      totalHits: Number(hits),
      resetTime: new Date(Date.now() + ttl * 1000),
    };
  }

  async increment(key) {
    const [totalHits, ttl] = await this.client
      .multi()
      .incr(key)
      .ttl(key)
      .exec();

    let t = ttl;
    if (t < 0) {
      await this.client.expire(key, this.window);
      t = this.window;
    }

    return {
      totalHits: Number(totalHits),
      resetTime: new Date(Date.now() + t * 1000),
    };
  }

  async decrement(key) {
    await this.client.decr(key);
  }

  async resetKey(key) {
    await this.client.del(key);
  }
}

function getLocation(ip) {
  return geoip.lookup(ip) || {};
}

export const rateLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  limit: (req) => {
    const { country } = getLocation(req.ip);
    // return country === "EG" ? 5 : 0;
    return 5;
  },
  legacyHeaders: false,
  standardHeaders: "draft-8",
  handler: (_, res) =>
    res.status(429).json({
      success: false,
      message: "Too many requests, please try again later",
    }),
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req.ip, 56);
    return `${ip}:${req.path}`;
  },
  store: new RedisStore({ redisClient: client }),
});
