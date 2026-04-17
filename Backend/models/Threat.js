const  mongoose = require("mongoose");

const threatSchema = new mongoose.Schema({

    input_text:{
        type:String
    },
    prediction:{
        type:String,
    },
    confidence:{
        type:Number
    },
    vectors:[{
        type:String
    }],
    timeStamp:{
        type:String,
        
    }
    
})

module.exports = mongoose.model("Threat",threatSchema);