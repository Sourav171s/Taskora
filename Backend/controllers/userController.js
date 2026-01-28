import User from "../models/userModel";
import validator from 'validator'
import bcrypt from 'bcrypt'

// Register Function
export async function registerUser(req,res){
    const { name, email, password} = req.body;

    if(!name || !email || !password){
        return res.status(400).json({success : false, message: "All fiels are required"});
    }
    if(!validator.isEmail(email)){
        return res.status(400).json({success: false, message: "Invalid Email"});
    }

    if(password.length < 8){
        return res.status(400).json({success: false, message: "Password must be atleast 8 characters"})
    }

    try {
        if(await User.findOne({email})){
            return res.status(409).json({success: false, message: "User already exists" });
        }

        const hashed = await bcrypt.hash(password,10);
        const user= await User.create({ name, emai, password :hashed});
        const token= createToken(user._id);

        res.status(201).json({success : true, token, user: {id : user._id, name : user.name, email: user.email}});


    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message : "Server errror"})
        
    }


}