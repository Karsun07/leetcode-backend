const validate = require("../utils/validate");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");
const Submission = require("../models/submission");
const {generateAccessToken,generateRefreshToken,setAuthCookies,clearAuthCookies}= require("../utils/tokenUtils");
const {generateOtp,storeOtp,sendOtpEmail,clearOtp,verifyOtp}=require("../utils/otpUtils");
const { verifyGoogleToken } = require("../utils/googleAuthUtils");
const validator = require("validator");

const sendOtp=async (req,res)=>{
    try{
        const {emailId}=req.body;
        if(!emailId || !validator.isEmail(emailId)){
           throw new Error("Invalid Email");
        }

        const existingUser=await User.findOne({emailId});
        if(existingUser){
        throw new Error("User already exists with this email");
        }

        const otp=generateOtp();
        await storeOtp(emailId,otp,"register");
        await sendOtpEmail(emailId,otp,"register");
        
        res.status(200).json({message:"Otp send to email"});
    }
    catch(err){
        res.status(400).json({message:err.message});

    }
}

const register = async (req, res) => {
    try {
        // validate firstName, email and Password
        validate(req.body);

        const { firstName, emailId, password,otp } = req.body;

        if(!otp){
            throw new Error("Otp is required");
        }
        const {valid,reason}=await verifyOtp(emailId,otp,"register");

        if(!valid){
            throw new Error(reason);
        }

        req.body.password = await bcrypt.hash(password, 10);
        // this is user route , if a user register by admin role is kept as user role
        req.body.role = 'user';

        // create user
        const user = await User.create(req.body);

        // remove otp so it can't be replayed
        await clearOtp(emailId,"register");

        // generate token
        const accessToken=generateAccessToken(user);
        const refreshToken=generateRefreshToken(user);
        setAuthCookies(res,accessToken,refreshToken);


        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role
        }
        res.status(200).json({
            user: reply,
            message: "Registered Successfull"
        })
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}

const login = async (req, res) => {
    try {
        const { emailId, password } = req.body;
        if (!emailId) {
            throw new Error("Invalid Email");
        }
        if (!password) {
            throw new Error("Invalid Password");
        }

        // find the user
        const user = await User.findOne({ emailId });
        if (!user) {
            throw new Error("Invalid Credential");
        }

        // this account was created via Google Sign-In and has no password set
        if (user.authProvider === 'google' && !user.password) {
            throw new Error("This account uses Google Sign-In. Please continue with Google.");
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            throw new Error("Invalid Credential");
        }
        const accessToken=generateAccessToken(user);
        const refreshToken=generateRefreshToken(user);
        setAuthCookies(res,accessToken,refreshToken);
        
        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role  
        }
        res.status(201).json({
            user: reply,
            message: "Loggin Successfull"
        })
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
const logout = async (req, res) => {
    try {
        const { accessToken,refreshToken } = req.cookies;
        
        if(accessToken){
            const accessPayload=jwt.decode(accessToken);
            await redisClient.set(`token:${accessToken}`,"Blocked");
            if(accessPayload?.exp){
                await redisClient.expireAt(`token:${accessToken}`,accessPayload.exp);
            }
        }
        if(refreshToken){
            const refreshPayload=jwt.decode(refreshToken);
            await redisClient.set(`refreshToken:${refreshToken}`,"Blocked");
            if(refreshPayload?.exp){
                await redisClient.expireAt(`refreshToken:${refreshToken}`,refreshPayload.exp);
            }
        }

        // delete the cookies right now
        clearAuthCookies(res);
        
        res.send("Logged out Successfully");
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}

const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            throw new Error("Refresh token not present, please login again");
        }
 
        // will throw if expired/invalid/signed with wrong secret
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY);
 
        // reject if this refresh token was already blocklisted (e.g. by logout)
        const isBlocked = await redisClient.exists(`refreshToken:${refreshToken}`);
        if (isBlocked) {
            throw new Error("Refresh token invalid, please login again");
        }
 
        const user = await User.findById(payload._id);
        if (!user) {
            throw new Error("User Not Found");
        }

        // stale refresh token from before a 'logout all devices' (or a
        // password reset, which also bumps this) — reject it
        if (user.sessionsValidAfter && payload.iat * 1000 < user.sessionsValidAfter.getTime()) {
            throw new Error("Refresh token invalid, please login again");
        }
 
        // rotate: invalidate the old refresh token and issue a brand new
        // access + refresh pair, so a stolen refresh token is only usable once
        await redisClient.set(`refreshToken:${refreshToken}`, 'Blocked');
        await redisClient.expireAt(`refreshToken:${refreshToken}`, payload.exp);
 
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        setAuthCookies(res, newAccessToken, newRefreshToken);
 
        res.status(200).json({ message: "Access token refreshed" });
    }
    catch (err) {
        res.status(401).json({ message: err.message });
    }
}
const logoutAllDevices=async (req,res)=>{
     try {
        const userId=req.result._id;

        // this is the actual 'logout everywhere' action: every access/refresh
        // token already issued has an 'iat' before this timestamp, so as soon as
        // this save completes, userMiddleware/adminMiddleware/refreshAccessToken
        // will reject all of them on their next use, on every device
        await User.findByIdAndUpdate(userId, { sessionsValidAfter: new Date() });

        const { accessToken,refreshToken } = req.cookies;
        
        if(accessToken){
            const accessPayload=jwt.decode(accessToken);
            await redisClient.set(`token:${accessToken}`,"Blocked");
            if(accessPayload?.exp){
                await redisClient.expireAt(`token:${accessToken}`,accessPayload.exp);
            }
        }
        if(refreshToken){
            const refreshPayload=jwt.decode(refreshToken);
            await redisClient.set(`refreshToken:${refreshToken}`,"Blocked");
            if(refreshPayload?.exp){
                await redisClient.expireAt(`refreshToken:${refreshToken}`,refreshPayload.exp);
            }
        }

        // delete the cookies right now
        clearAuthCookies(res);
        
        res.send("Logged out from all devices successfully");
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
// Step 1 of forgot-password: user submits their email, we mail them a code.
// Unlike registration OTP, this REQUIRES the user to already exist — and,
// importantly, does not reveal whether the email exists or not in the
// response, so this endpoint can't be used to check who's registered.
const forgotPasswordSendOtp = async (req, res) => {
    try {
        const { emailId } = req.body;
        if (!emailId || !validator.isEmail(emailId)) {
            throw new Error("Invalid Email");
        }

        const user = await User.findOne({ emailId });
        if (user) {
            const otp = generateOtp();
            await storeOtp(emailId, otp, "reset");
            await sendOtpEmail(emailId, otp, "reset");
        }
        // same response whether or not the user exists — prevents this
        // endpoint being used to enumerate which emails are registered
        res.status(200).json({ message: "If that email is registered, an OTP has been sent" });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}

// Step 2 of forgot-password: verify the OTP and set the new password.
const resetPassword = async (req, res) => {
    try {
        const { emailId, otp, newPassword } = req.body;
        if (!emailId || !validator.isEmail(emailId)) {
            throw new Error("Invalid Email");
        }
        if (!otp) {
            throw new Error("Otp is required");
        }
        if (!newPassword || !validator.isStrongPassword(newPassword)) {
            throw new Error("Weak Password");
        }

        const { valid, reason } = await verifyOtp(emailId, otp, "reset");
        if (!valid) {
            throw new Error(reason);
        }

        const user = await User.findOne({ emailId });
        if (!user) {
            throw new Error("User Not Found");
        }

        user.password = await bcrypt.hash(newPassword, 10);
        // changing the password should log out every existing session,
        // on every device — same mechanism as logoutAllDevices
        user.sessionsValidAfter = new Date();
        await user.save();

        // otp has done its job — remove it so it can't be replayed
        await clearOtp(emailId, "reset");

        res.status(200).json({ message: "Password reset successfully. Please log in again." });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}

// Handles both Google signup AND Google sign-in — Google doesn't distinguish
// the two, so we do: no existing user with this email -> create one;
// existing LOCAL account with this email -> link the googleId onto it
// (email is already verified by Google, so this is safe); existing GOOGLE
// account -> just log in.
const googleAuth = async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            throw new Error("Google credential is required");
        }

        const { googleId, email, emailVerified, firstName } = await verifyGoogleToken(credential);

        if (!emailVerified) {
            throw new Error("Google account email is not verified");
        }

        let user = await User.findOne({ emailId: email });

        if (!user) {
            // brand new account — Google-only, no password
            user = await User.create({
                firstName,
                emailId: email,
                role: 'user',
                authProvider: 'google',
                googleId,
            });
        } else if (!user.googleId) {
            // existing local (email/password) account with the same email —
            // link this Google identity onto it rather than creating a duplicate
            user.googleId = googleId;
            await user.save();
        }
        // else: existing account already linked to this googleId — just log in

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        setAuthCookies(res, accessToken, refreshToken);

        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role
        }
        res.status(200).json({
            user: reply,
            message: "Google authentication successful"
        })
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}

const adminRegister = async (req, res) => {
    try {
        // validate the data;
        //   if(req.result.role!='admin')
        //     throw new Error("Invalid Credentials");  
        validate(req.body);
        const { firstName, emailId, password } = req.body;

        req.body.password = await bcrypt.hash(password, 10);
        //

        const user = await User.create(req.body);
        const accessToken=generateAccessToken(user);
        const refreshToken=generateRefreshToken(user);
        setAuthCookies(res,accessToken,refreshToken);


        res.status(201).send("User Registered Successfully");
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}

const deleteProfile = async (req, res) => {
    try {
        const userId = req.result._id;
        // user delete
        await User.findByIdAndDelete(userId);
        // M-1
        // user's submissions delete
        // await Submission.deleteMany({userId});
        // M-2
        // i added userSchema.post('findOneAndDelete',async function (userInfo){submision.delet})
        // this is post operation it is implemented after User.findByIdANdDelete 
        // pre operation run before     
        res.status(200).send("Deleted Successfully");

    }
    catch (err) {
        res.status(500).send("Internal Server Error");
    }

}
    

module.exports = { register, login, logout, adminRegister, deleteProfile ,refreshAccessToken,logoutAllDevices,sendOtp,forgotPasswordSendOtp,resetPassword,googleAuth};