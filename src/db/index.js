import mongoose from "mongoose";
import { DBName } from "../constants.js";
export const Dbconnect = async () => {
  try {
    const dbinstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DBName}` || "");
    console.log(`Database connnected Successfully.....!`);
  } catch (error) {
    console.log(`Database connection failed....` + error);
  }
};
