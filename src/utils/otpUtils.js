const nodemailer = require("nodemailer");
const redisClient=require("../config/redis");

const OTP_EXPIRY_SEC = 5 * 60; // 5 minutes

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateOtp=()=>{
    return Math.floor(100000+Math.random()*900000).toString();
}

// store the otp along with the email in redis with 5min expiry
const storeOtp=async (emailId,otp)=>{
    redisClient.set(`otp:${emailId}`,otp,{EX:OTP_EXPIRY_SEC});
}

const sendOtpEmail=async (emailId,otp)=>{
    try {
    await transporter.sendMail({
    from: `"codingProject" <${process.env.EMAIL_USER}>`, 
    to: emailId, 
    subject: "Your verification code", 
    text: `Your Otp is ${otp}. It expires in 5 minutes. Do not share it with anyone.`, 
    html: `<p>Your verification code is:</p><h2 style="letter-spacing:4px;">${otp}</h2><p>This code expires in 5 minutes. Do not share it with anyone.</p>`, 
  });

} 
catch (err) {
  console.error("Error while sending mail:", err);
}
}

const verifyOtp=async (emailId,otp)=>{
    const storedOtp=await redisClient.get(`otp:${emailId}`);
    if(!storedOtp){
        return {valid:false,reason:"Otp expired or not requested"};
    }
    if(storedOtp!=otp){
        return {valid:false,reason:"Incorrect Password"};
    }
    return {valid:true};
}

const clearOtp = async (emailId) => {
    await redisClient.del(`otp:${emailId}`);
};

module.exports={generateOtp,storeOtp,sendOtpEmail,verifyOtp,clearOtp};
