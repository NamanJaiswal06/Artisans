const mongoose = require("mongoose")

const LogSchema = new mongoose.Schema({
  incidentId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Incident"
  },

  action:{
    type:String,
    enum:["created", "escalated" , "resolved"],
  },
  performedby:{
    type:String,
    enum:["system" , "user"],
    default:"system"

  },
  messageDetails:{
    type:String,
  },
  timestamp:{
    type:Date,
    default:Date.now
  }


})

module.exports = mongoose.model("Log",LogSchema);