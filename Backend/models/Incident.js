const mongoose = require("mongoose");

const IncidentSchema  = new mongoose.Schema({
    type:{
        type:String,
        default:"Safe"
        
    },
    threatLevel:{
        type:String,
        default:"Low"
    },
    confidence:{
        type:Number,
        default:0
    },
    reason:{
        type:String,

    },
    action:{
        type:String,
        
    },
    status:{
        type:String,
        default:"Pending",
        enum:["Pending","Resolved","Rejected"]
    },
    source:{
        type:String,
    },
    content:{
        type:String,
    },
    assignedTo:{
        type:String,
        enum:["security" , "finance"]
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
    
    

    
})

module.exports = mongoose.model("Incident",IncidentSchema);