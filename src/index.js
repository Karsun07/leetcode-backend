const express=require("express");
const app=express();
require('dotenv').config();
const main=require("./config/database");
const cookieParser=require("cookie-parser");
const authRouter=require("./routes/userAuth");
const problemRouter=require("./routes/problemCreator");
const redisClient=require("./config/redis");

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("Server is running");
});
app.use("/user",authRouter);
app.use("/user",problemRouter);



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