import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  userName: String,
  message: String,
  timestamp: { type: Date, default: new Date() },
});

export const chatModel = mongoose.model("messages", chatSchema);
