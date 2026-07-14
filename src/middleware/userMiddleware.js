const jwt=require("jsonwebtoken");
const User = require("../models/user");
const redisClient=require("../config/redis");

const userMiddleware=async (req,res,next)=>{
    try{
        const {accessToken}=req.cookies;
        if(!accessToken) throw new Error("Token not Present");

        const payload=jwt.verify(accessToken,process.env.JWT_KEY);

        const {_id}=payload;
        if(!_id) throw new Error("Invalid token");

        const result=await User.findById(_id);
        if(!result) throw new Error("User Not Found");

        const isBlocked=await redisClient.exists(`token:${accessToken}`);

        if(isBlocked)
            throw new Error("Invalid Token");
        
        req.result=result;
        next();
    }
    catch(err){
        res.status(401).send("Error: "+ err.message)
    }

}
module.exports = userMiddleware;