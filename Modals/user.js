
const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
    },
    Phone_No:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    googleId: {
      type:  String,
    },
    is_verified:{
        type:Number,
        default:0,
    },  
      image:{
        type:String,
        required:true
    },
    isHost: {
        type: Boolean,
        default: false
    },
    hostVerified: {
        type: Boolean,
        default: false
    },
    hostApplicationDate: {
        type: Date
    },
    hostVerificationDocuments: {
        idProof: String,
        addressProof: String
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    hostRejectionReason: {
        type: String
    }
})

userSchema.index({email:1},{unique:true});

 module.exports = mongoose.model("User",userSchema);
