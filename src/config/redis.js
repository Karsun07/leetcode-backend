const { createClient } = require("redis");

const redisClient = createClient({
    username: "default",
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: "base-macrofresh-crate-36628.db.redis.io",
        port: 11391
    }
});

redisClient.on("error", (err) => {
    console.log("Redis Client Error: " + err);
});

module.exports = redisClient;