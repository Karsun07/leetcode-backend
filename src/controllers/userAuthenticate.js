const validate=require("../utils/validate");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");

const register=async (req,res)=>{
    try{
        // validate firstName, email and Password
        validate(req.body);
        const {firstName,emailId,password}=req.body;
        req.body.password=await  bcrypt.hash(password,10);
        // this is user route , if a user register by admin role is kept as user role
        req.body.role='user';
        
        // create user
        const user=await User.create(req.body);
        // generate token
        const token=jwt.sign({_id:user._id,emailId:emailId,role:'user'},process.env.JWT_KEY,{expiresIn:60*60});
        res.cookie('token',token,{maxAge: 60*60*1000});
        res.status(201).send("User Registered Successfully");
    }
    catch(err){
        res.status(400).send("Error:"+err);

    }
}

const login=async (req,res)=>{
    try{
        const {emailId,password}=req.body;
        if(!emailId){
            throw new Error("Invalid Email");
        }
        if(!password){
            throw new Error("Invalid Password");
        }

        // find the user
        const user=await User.findOne({emailId});
        if(!user){
            throw new Error("Invalid Credential");
        }
        const isMatch=await bcrypt.compare(password,user.password);

        if(!isMatch){
            throw new Error("Invalid Credential");
        }
        const token =  jwt.sign({_id:user._id , emailId:emailId,role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
        res.cookie('token',token,{maxAge: 60*60*1000}); 
        res.status(200).send("Logged In Succeessfully");
    }
    catch(err){
        res.status(401).send("Error: "+err.message);
    }
}
const logout=async (req,res)=>{
    try{
        const {token}=req.cookies;
        const payload=jwt.decode(token);
        
        // token add in redis blocklist and when to remove it from the blocklist
        await redisClient.set(`token:${token}`,'Blocked');
        await redisClient.expireAt(`token:${token}`,payload.exp);
        
        // delete the cookies right now
        res.cookie("token",null,{expires:new Date(Date.now())});
        res.send("Logged out Successfully");
    }
    catch(err){
        res.status(503).send("Error: "+err);
    }
}

const adminRegister = async(req,res)=>{
    try{
        // validate the data;
    //   if(req.result.role!='admin')
    //     throw new Error("Invalid Credentials");  
      validate(req.body); 
      const {firstName, emailId, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
    //
    
     const user =  await User.create(req.body);
     const token =  jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
     res.cookie('token',token,{maxAge: 60*60*1000});
     res.status(201).send("User Registered Successfully");
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}


module.exports = {register, login,logout,adminRegister};
