const mongoose = require("mongoose");

require("dotenv").config();

exports.dbConnect = () => {
    
        mongoose.connect(process.env.MONGODB_URL)
        .then(()=>{
            console.log("Database connected successfully");
        })
        .catch((err)=>{
            console.log(err.message);
            throw err;
            process.exit(1);
        })
   
}
