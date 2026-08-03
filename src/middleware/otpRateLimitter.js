const redisClient = require("../config/redis");

const EMAIL_COOLDOWN_SEC = 60;   // at most 1 OTP per email every 60 seconds
const IP_WINDOW_SEC = 15 * 60;   // 15 minute rolling window
const IP_MAX_REQUESTS = 5;       // at most 5 OTP requests per IP per window

// Two independent checks, because they defend against two different attacks:
//
// 1. Per-email cooldown — stops someone spamming ONE victim's inbox by
//    hammering the endpoint with the same emailId over and over.
// 2. Per-IP request cap — stops a bot/script cycling through many DIFFERENT
//    emails from the same machine (email cooldown alone wouldn't catch this,
//    since each email would only be hit once).
const otpRateLimiter = async (req, res, next) => {
    try {
        const { emailId } = req.body;
        const ip = req.ip || req.socket?.remoteAddress || "unknown";

        if (emailId) {
            const emailKey = `otp_cooldown:${emailId}`;
            const emailBlocked = await redisClient.exists(emailKey);
            if (emailBlocked) {
                return res.status(429).json({
                    message: "Please wait a minute before requesting another OTP for this email"
                });
            }
        }

        const ipKey = `otp_ip_count:${ip}`;
        const count = await redisClient.incr(ipKey);
        if (count === 1) {
            // first request from this IP in this window — start the expiry clock
            await redisClient.expire(ipKey, IP_WINDOW_SEC);
        }
        if (count > IP_MAX_REQUESTS) {
            return res.status(429).json({
                message: "Too many OTP requests from this device. Please try again later."
            });
        }

        // only set the cooldown once we've decided to actually allow this request
        if (emailId) {
            await redisClient.set(`otp_cooldown:${emailId}`, "1", { EX: EMAIL_COOLDOWN_SEC });
        }

        next();
    } catch (err) {
        console.error("OTP rate limiter error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = otpRateLimiter;