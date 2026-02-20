import mongoose from "mongoose";

const userSchema= new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email : {
        type: String , 
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    }

})

const userModel = mongoose.models.user || mongoose.model("user",userSchema);       //mongoose.models.user is used so when we use nodemon then after every reload it doesn't give error that the user model already exists but use the existing user model
export default userModel;