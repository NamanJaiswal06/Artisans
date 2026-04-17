const Threat = require("../models/Threat");

exports.storeThreat = async (req ,res) =>{



    try{

        const data = await Threat.create(req.body);;


        res.json({
            success:true,
            message:"Threat stored successfully",
            data
        })





    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }

}