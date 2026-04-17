const mongoose = require("mongoose")

const ThreatRuleSchema = new mongoose.Schema({
    name:{
        type:String,
        enum:["wirefraud" , "ceofraud"],
    },
    keyword:{
        type:String,
        //scope
    },
    threatType:{
        type:String,
        enum:["email","url","attachment"],
    },
    severity:{
        type:String,
        enum:["Low","Medium","High","Critical"],
        default:"Low"
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    
    
    
})

module.exports = mongoose.model("ThreatRule", ThreatRuleSchema);