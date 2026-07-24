const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis")

const adminMiddleware = async (req,res,next)=>{

    try{

        const {accessToken} = req.cookies;
        if(!accessToken)
            throw new Error("Token is not persent");

        const payload = jwt.verify(accessToken,process.env.JWT_KEY);

        const {_id} = payload;

        if(!_id){
            throw new Error("Invalid token");
        }

        const result = await User.findById(_id);

        if(payload.role!='admin')
            throw new Error("Invalid Token");

        if(!result){
            throw new Error("User Doesn't Exist");
        }
        // if 'logout from all devices' happened after this token was issued,
        // this token is stale even though it hasn't 'expired' yet
        if(result.sessionsValidAfter && payload.iat * 1000 < result.sessionsValidAfter.getTime())
            throw new Error("Invalid Token");
        // Redis ke blockList mein persent toh nahi hai

        const IsBlocked = await redisClient.exists(`token:${accessToken}`);

        if(IsBlocked)
            throw new Error("Invalid Token");

        req.result = result;


        next();
    }
    catch(err){
        res.status(401).send("Error: "+ err.message)
    }

}


module.exports = adminMiddleware;