// in this we will connect our database
import mongoose from "mongoose";
import 'dotenv/config';

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MongoURL);
    console.log("DB Connected");
  } catch (error) {
    console.error("DB connection failed:", error.message);
    process.exit(1);           //this immediately forcefully stops the server
  }
};
