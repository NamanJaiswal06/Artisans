const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema({
    incidentId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Incident"
    },
    messageDetails:{
        type:String,
    },
    severity:{
        type:String,
        enum:["Low","Medium","High","Critical"],
        default:"Low"
    },
    isRead:{
        type:Boolean,
        default:false
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
    
    
})

module.exports = mongoose.model("Alert",AlertSchema);