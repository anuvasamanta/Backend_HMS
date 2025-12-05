
const redis = require("redis");
const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const client = redis.createClient({ url });

client.on("error", (err) => console.error("Redis error:", err));
(async () => {
  try {
    await client.connect();
    console.log("Redis connected");
  } catch (err) {
    console.error("Redis connect failed:", err);
  }
})();

module.exports = client;
