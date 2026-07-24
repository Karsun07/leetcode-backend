const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_EXPIRY_SEC = 15 * 60;       
const REFRESH_TOKEN_EXPIRY_SEC =  60 * 60; // 1 hour

const generateAccessToken = (user) => {
    return jwt.sign(
        { _id: user._id, emailId: user.emailId, role: user.role },
        process.env.JWT_KEY,
        { expiresIn: ACCESS_TOKEN_EXPIRY_SEC }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { _id: user._id },
        process.env.JWT_REFRESH_KEY,
        { expiresIn: REFRESH_TOKEN_EXPIRY_SEC }
    );
};

// Sets both cookies on the response. accessToken is readable by the API on every
// call; refreshToken is only read by the /refresh route, so give it a narrower path.
const setAuthCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        maxAge: ACCESS_TOKEN_EXPIRY_SEC * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: REFRESH_TOKEN_EXPIRY_SEC * 1000,
        path: "/user", // only sent back to /user/refresh and other /user routes
    });
};

const clearAuthCookies = (res) => {
    res.cookie("accessToken", null, { expires: new Date(Date.now()) });
    res.cookie("refreshToken", null, { expires: new Date(Date.now()), path: "/user" });
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    setAuthCookies,
    clearAuthCookies,
};