import mongoose from "mongoose";

export const connectWithDB = async () => {
  console.log("env => ", process.env.DB_URL);
  await mongoose.connect(process.env.DB_URL);
  console.log("connected with DB...");
};
