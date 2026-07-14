const express = require("express");

const authRouter = express.Router();

const { register, login, logout, adminRegister, deleteProfile, refreshAccessToken } = require("../controllers/userAuthenticate");
const userMiddleware = require("../middleware/userMiddleware");
const adminMiddleware = require('../middleware/adminMiddleware');
// register
authRouter.post("/register", register);
// login
authRouter.post("/login", login);
// logout
authRouter.post("/logout", userMiddleware, logout);
// refresh: NOT behind userMiddleware, since the whole point is that the
// access token may already be expired here; it only needs the refreshToken cookie
authRouter.post("/refresh", refreshAccessToken);

authRouter.post('/admin/register', adminMiddleware, adminRegister);
authRouter.delete("/profile", userMiddleware, deleteProfile);
authRouter.get("/check", userMiddleware, (req, res) => {
    const reply = {
        firstName: req.result.firstName,
        emailId: req.result.emailId,
        _id: req.result._id,
        role: req.result.role,
    }
    res.status(200).json({
        user: reply,
        message: "Valid User"
    })
})
// get profile
// authRouter.get("/getProfile",getProfile);

module.exports = authRouter;