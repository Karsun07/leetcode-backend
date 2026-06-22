const express=require("express");
const app=express();
require('dotenv').config();
const main=require("./config/database");
const cookieParser=require("cookie-parser");

app.use(express.json());
app.use(cookieParser());


main()
.then(async ()=>{
    console.log("Connected to DB");  
    app.listen(process.env.PORT_NUMBER,()=>{
    console.log("Listening at Port "+process.env.PORT_NUMBER);
})
})
.catch(err=>{
    console.log("Error Occured : "+err);
})


