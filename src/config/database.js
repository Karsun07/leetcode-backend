const mongoose=require("mongoose");

async function main(){
    if(!process.env.DB_CONNECT_STRING) throw new Error("DB connect string not present in environment variable.");
    
    await mongoose.connect(process.env.DB_CONNECT_STRING);
}
module.exports=main;