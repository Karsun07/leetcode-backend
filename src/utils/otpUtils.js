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

// store the otp along with the email in redis with 5min expiry.
// 'purpose' keeps a registration OTP and a password-reset OTP for the same
// email completely separate, so one can never be replayed as the other.
const storeOtp=async (emailId,otp,purpose="register")=>{
    await redisClient.set(`otp:${purpose}:${emailId}`,otp,{EX:OTP_EXPIRY_SEC});
}

const sendOtpEmail=async (emailId,otp,purpose="register")=>{
    const subject = purpose === "reset" ? "Your password reset code" : "Your verification code";
    const intro = purpose === "reset" ? "Use this code to reset your password:" : "Your verification code is:";
    try {
    await transporter.sendMail({
    from: `"codingProject" <${process.env.EMAIL_USER}>`, 
    to: emailId, 
    subject, 
    text: `${intro} ${otp}. It expires in 5 minutes. Do not share it with anyone.`, 
    html: `<p>${intro}</p><h2 style="letter-spacing:4px;">${otp}</h2><p>This code expires in 5 minutes. Do not share it with anyone.</p>`, 
  });

} 
catch (err) {
  console.error("Error while sending mail:", err);
  throw new Error("Failed to send OTP email");
}
}

const verifyOtp=async (emailId,otp,purpose="register")=>{
    const storedOtp=await redisClient.get(`otp:${purpose}:${emailId}`);
    if(!storedOtp){
        return {valid:false,reason:"Otp expired or not requested"};
    }
    if(storedOtp!=otp){
        return {valid:false,reason:"Incorrect Password"};
    }
    return {valid:true};
}

const clearOtp = async (emailId,purpose="register") => {
    await redisClient.del(`otp:${purpose}:${emailId}`);
};

module.exports={generateOtp,storeOtp,sendOtpEmail,verifyOtp,clearOtp};