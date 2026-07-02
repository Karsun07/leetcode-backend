const validate=require("../utils/validate");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");
const Submission=require("../models/submission");

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
        const reply={
            firstName:user.firstName,
            emailId:user.emailId,
            _id:user._id
        }
        res.status(200).json({
            user:reply,
            message:"Loggin Successfull"
        })
    }
    catch(err){
    res.status(400).json({ message: err.message });
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
        const reply={
            firstName:user.firstName,
            emailId:user.emailId,
            _id:user._id
        }
        res.status(201).json({
            user:reply,
            message:"Loggin Successfull"
        })
    }
    catch(err){
    res.status(400).json({ message: err.message });
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
    res.status(400).json({ message: err.message });
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
    res.status(400).json({ message: err.message });
}
}

const deleteProfile=async (req,res)=>{
    try{
        const userId=req.result._id;
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
    catch(err){
        res.status(500).send("Internal Server Error");
    }

}

module.exports = {register, login,logout,adminRegister,deleteProfile};
