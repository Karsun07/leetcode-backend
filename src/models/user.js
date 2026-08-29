const mongoose = require('mongoose');
const {Schema} = mongoose;

const userSchema = new Schema({
    firstName:{
        type: String,
        required: true,
        minLength:3,
        maxLength:20
    },
    lastName:{
        type:String,
        minLength:3,
        maxLength:20,
    },
    emailId:{
        type:String,
        required:true,
        unique:true,
        trim: true,
        lowercase:true,
        immutable: true,
    },
    age:{
        type:Number,
        min:6,
        max:80,
    },
    role:{
        type:String,
        enum:['user','admin'],
        default: 'user'
    },
    sessionsValidAfter:{
        type:Date,
        default:null
    },
    // 'local' = normal email/password account, 'google' = Google Sign-In only.
    // A local account can also gain a googleId later if the same email signs
    // in with Google (we link them rather than creating a duplicate user).
    authProvider:{
        type:String,
        enum:['local','google'],
        default:'local'
    },
    googleId:{
        type:String,
        unique:true,
        sparse:true // allows many users with no googleId at all
    },
    problemSolved:{
        type:[{
            type:Schema.Types.ObjectId,
            ref:'problem',
           
        }]
    }, 
    password:{
        type:String,
        // only required for local accounts — a Google-only account never has one
        required: function () {
            return this.authProvider === 'local';
        }
    }
},{
    timestamps:true
});

// this will run after we delete the user from from db 
// post => after findByIdAndDelete , pre =>before findByIdAndDelete
userSchema.post('findOneAndDelete',async function (userInfo){
    if(userInfo){
        await mongoose.model("submission").deleteMany({userId:userInfo._id});
    }
})

const User = mongoose.model("user",userSchema);

module.exports = User;