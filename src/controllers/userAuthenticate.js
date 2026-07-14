const validate = require("../utils/validate");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");
const Submission = require("../models/submission");
const {generateAccessToken,generateRefreshToken,setAuthCookies,clearAuthCookies}= require("../utils/tokenUtils");

const register = async (req, res) => {
    try {
        // validate firstName, email and Password
        validate(req.body);
        const { firstName, emailId, password } = req.body;
        req.body.password = await bcrypt.hash(password, 10);
        // this is user route , if a user register by admin role is kept as user role
        req.body.role = 'user';

        // create user
        const user = await User.create(req.body);
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


module.exports = { register, login, logout, adminRegister, deleteProfile ,refreshAccessToken};
