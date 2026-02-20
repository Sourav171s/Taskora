import jwt from 'jsonwebtoken'
import User from '../models/userModel.js';

// const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here"

export default async function authMiddleware(req,res,next){
    //  GRAB THE BEARER TOKEN FROM AUTHORIZATION HEADER
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(401).json({success: false, message: "Not Authorized, token missing"})
    }

    const token = authHeader.split(' ')[1];           //this removes bearer and gives only the token present after it
    
    // VERIFY AND ATTACH USER OBJECT

    try {
        const payload= jwt.verify(token,process.env.JWT_SECRET);
        const user= await User.findById(payload.id).select('-password');

        if(!user){
            return res.status(401).json({success: false, message: "User not found"});
        }

        //after fetching of user we attach it with the request
        req.user= user;
        next();


    } catch (error) {
        console.log("JWT verification failed", error);
        return res.status(401).json({success: false, message: "Token invalid or expired"})
    }


}