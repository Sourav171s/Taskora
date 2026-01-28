// in this we will connect our database
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://taskora_db:taskora123@cluster0.p8b2acm.mongodb.net/Taskora?retryWrites=true&w=majority&authSource=admin"
    );
    console.log("DB Connected");
  } catch (error) {
    console.error("DB connection failed:", error.message);
    process.exit(1);
  }
};
