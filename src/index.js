const express=require("express");
const app=express();
require('dotenv').config();
const main=require("./config/database");
const cookieParser=require("cookie-parser");
const authRouter=require("./routes/userAuth");
const problemRouter=require("./routes/problemCreator");
const redisClient=require("./config/redis");
const submitRouter = require("./routes/submit");
const aiRouter = require("./routes/aiChatting")
const videoRouter = require("./routes/videoCreator");
const paymentRouter = require("./routes/paymentRoute");

const cors = require('cors')

const allowedOrigins = [
    'http://localhost:5173',
    process.env.CLIENT_URL, // set this to your deployed frontend URL, e.g. https://yourapp.vercel.app
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true 
}))
app.use(express.json());
app.use(cookieParser());


app.use("/user",authRouter);
app.use("/problem",problemRouter);
app.use("/submission",submitRouter);
app.use('/ai',aiRouter);
app.use("/video",videoRouter);
app.use("/payment",paymentRouter);


async function initializeConnection(){
    try{
        await Promise.all([main(),redisClient.connect()]);
        console.log("DB connected");
        const PORT = process.env.PORT || process.env.PORT_NUMBER;
        app.listen(PORT, ()=>{
            console.log("Server listening at port number: "+ PORT);
        })
    }
    catch(err){
        console.log("Error: "+err);
    }

}
initializeConnection();