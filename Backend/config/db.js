// in this we will connect our database
import mongoose from "mongoose";
import 'dotenv/config';

export const connectDB = async (retries = 5, delay = 5000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(process.env.MongoURL, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log("DB Connected successfully ✅");
      return;
    } catch (error) {
      console.error(`DB connection attempt ${attempt}/${retries} failed:`, error.message);
      if (attempt < retries) {
        console.log(`Retrying DB connection in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error("All DB connection attempts failed. Exiting server process.");
        process.exit(1);
      }
    }
  }
};
