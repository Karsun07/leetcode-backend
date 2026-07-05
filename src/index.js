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

const cors = require('cors')

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true 
}))
app.use(express.json());
app.use(cookieParser());


app.use("/user",authRouter);
app.use("/problem",problemRouter);
app.use("/submission",submitRouter);
app.use('/ai',aiRouter);


async function initializeConnection(){
    try{
        await Promise.all([main(),redisClient.connect()]);
        console.log("DB connected");
        app.listen(process.env.PORT_NUMBER, ()=>{
            console.log("Server listening at port number: "+ process.env.PORT_NUMBER);
        })
    }
    catch(err){
        console.log("Error: "+err);
    }

}
initializeConnection();