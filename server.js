// package imports
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import "dotenv/config";

// module imports
import { connectWithDB } from "./src/config/chat.config.js";
import { chatModel } from "./src/schema/chat.schema.js";

// initializing express
const app = express();

// setting up input formats
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cors initialization
app.use(cors());

// creating the server
const server = http.createServer(app);

// set up the socket.io here
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["POST", "GET"],
  },
});

// listening for connection
io.on("connection", (socket) => {
  console.log("Socket connected...");
  // listening for user joining
  socket.on("join", async (userName) => {
    try {
      // getting chat history from db
      const chatHistory = await chatModel.find().sort({ timestamp: 1 });

      // sending welcome message with chat history
      socket.emit("welcome", { message: `Welcome ${userName}!`, chatHistory });
      
      // notifying the other users
      io.emit("newMember", userName);
    } catch (error) {
      console.log(error);
    }
  });

  // listening for a message
  socket.on("messageSend", async (data) => {
    try {
      // save to database
      const newMessage = new chatModel({
        userName: data.userName,
        message: data.message,
        profilePicUrl: `https://api.multiavatar.com/${data.userName}.svg`,
        timestamp: new Date(),
      });
      await newMessage.save();
      console.log("message from sender => ", newMessage);

      // emitting message data to all clients
      io.emit("message", newMessage);
    } catch (error) {
      console.log(error);
    }
  });
});

// app.get("/", (req, res) => {
//   console.log(io);
//   res.send("welcome");
// });

// listening to server
server.listen(3000, () => {
  console.log("server running at port 3000");
  // connect db here
  connectWithDB();
});
