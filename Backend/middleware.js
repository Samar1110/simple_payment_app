const jwt=require("jsonwebtoken")
const JWT_KEY = require ("./config")

const authMiddleware = (req,res,next)=>{

    // console.log("reached her")

    const authHeader = req.headers.authorization;
    // console.log(authHeader)
    if(!authHeader||!authHeader.startsWith('Bearer ')){
        return res.status(403).json({
            message:"Invalid Authorization"
        })
    }

    const token=authHeader.split(' ')[1];

    try {
        const decode = jwt.verify(token,JWT_KEY);

        if(decode.userId) {
            req.userId = decode.userId;
            next();
        }
        else{
            return res.status(403).json({
                message:"Auth failed"
            })
        }

    } catch (error) {
        return res.status(403).json({
            message:"Try Again"
        })
    }

}

module.exports = {
    authMiddleware
}