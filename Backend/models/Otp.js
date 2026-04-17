const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");

const OtpSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    otp:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
   
})

//pre middleware
async function sendVerificationEmail (email, otp){
    try{

        const mailresponse = await mailSender(email,"OTP Verification Email",otp);
        console.log("Mail Sent Successfully",mailresponse);


    }catch(err){
        console.log(err.message);
        throw err;




    }
}

OtpSchema.pre("save", async function(){
    try {
        await sendVerificationEmail(this.email, this.otp);
    } catch(err) {
        // Email failure should not block OTP from being saved
        console.error("OTP email failed (non-fatal):", err.message);
    }
})

module.exports = mongoose.model("Otp",OtpSchema);




