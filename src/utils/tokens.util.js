import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const generateAccessToken = (payload) => {
    return jwt.sign(payload,process.env.ACESS_TOKEN_SECRET,{
        expiresIn : '1h',        
    })
}

const generateRefreshToken = (payload) => {
    return jwt.sign(payload,process.env.REFRESH_TOKEN_SECRET,{
        expiresIn : '7d',        
    })
}



export {generateAccessToken , generateRefreshToken};