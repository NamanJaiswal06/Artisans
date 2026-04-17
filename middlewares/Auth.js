const jwt  = require("jsonwebtoken");
require("dotenv").config();

exports.authMiddleware = async (req, res, next) => {
    try{

        const token = req.cookies.token || req.body.token || req.header("Authorization").replace("Bearer ","");

        if(!token){
            return res.status(401).json({
                success:false,
                message:"Token not found"
            })
        }

        const decodedToken = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decodedToken;
        next();

    }catch(err){
        return res.status(500).json({
            success:false,
            message:"Failed to authenticate token",
            error:err.message
        })
    }
}

//isAdmin


exports.isAdmin = async (req, res, next) => {
    try{

        if(req.user.role !== "admin"){
            return res.status(403).json({
                success:false,
                message:"Access denied"
            })
        }
        next();

    }catch(err){
        return res.status(500).json({
            success:false,
            message:"Failed to authenticate admin",
            error:err.message
        })
    }
}

//is Security

exports.isSecurity = async (req, res, next) => {
    try{

        if(req.user.role !== "security"){
            return res.status(403).json({
                success:false,
                message:"Access denied"
            })
        }
        next();

    }catch(err){
        return res.status(500).json({
            success:false,
            message:"Failed to authenticate security",
            error:err.message
        })
    }
}


//isFinance
exports.isFinance = async (req, res, next) => {
    try{

        if(req.user.role !== "finance"){
            return res.status(403).json({
                success:false,
                message:"Access denied"
            })
        }
        next();

    }catch(err){
        return res.status(500).json({
            success:false,
            message:"Failed to authenticate finance",
            error:err.message
        })
    }
}