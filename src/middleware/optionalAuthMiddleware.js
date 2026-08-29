const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");

// Same validity checks as userMiddleware (signature, sessionsValidAfter,
// blocklist), but this NEVER rejects the request — it just leaves
// req.result undefined if the token is missing/invalid/expired, so a public
// route can still serve guests while behaving differently for logged-in
// (and premium) users.
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const { accessToken } = req.cookies;
        if (!accessToken) return next();

        const payload = jwt.verify(accessToken, process.env.JWT_KEY);
        const { _id } = payload;
        if (!_id) return next();

        const result = await User.findById(_id);
        if (!result) return next();

        if (result.sessionsValidAfter && payload.iat * 1000 < result.sessionsValidAfter.getTime())
            return next();

        const isBlocked = await redisClient.exists(`token:${accessToken}`);
        if (isBlocked) return next();

        req.result = result;
        next();
    }
    catch (err) {
        // any failure (expired token, bad signature, etc) — just proceed as a guest
        next();
    }
}
module.exports = optionalAuthMiddleware;