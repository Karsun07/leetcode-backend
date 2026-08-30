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

const isProd = process.env.NODE_ENV === 'production';

// Sets both cookies on the response. accessToken is readable by the API on every
// call; refreshToken is only read by the /refresh route, so give it a narrower path.
const setAuthCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        maxAge: ACCESS_TOKEN_EXPIRY_SEC * 1000,
        secure: isProd,                  // required for sameSite:'none'; cookie only sent over HTTPS
        sameSite: isProd ? 'none' : 'lax', // 'none' needed since frontend/backend are different domains in prod
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: REFRESH_TOKEN_EXPIRY_SEC * 1000,
        path: "/user", // only sent back to /user/refresh and other /user routes
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
    });
};

const clearAuthCookies = (res) => {
    // clearing attributes must match the ones used when setting, or some
    // browsers won't actually remove the cookie
    res.cookie("accessToken", null, { expires: new Date(Date.now()), secure: isProd, sameSite: isProd ? 'none' : 'lax' });
    res.cookie("refreshToken", null, { expires: new Date(Date.now()), path: "/user", secure: isProd, sameSite: isProd ? 'none' : 'lax' });
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    setAuthCookies,
    clearAuthCookies,
};