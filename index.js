const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const socketIO = require("socket.io");
const { connection } = require("./db");
require("dotenv").config();
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL, // Adjust as necessary for your environment
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// CORS options for Express
const corsOptions = {
  origin: process.env.FRONTEND_URL, // Your frontend URL
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions)); // Apply CORS middleware with specific options
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

app.use((req, res, next) => {
  req.io = io; // Attach the io instance to the request object
  next();
});
// Port configuration
const Port = process.env.PORT || 8080;

// Routes
const userRouter = require("./routes/user.routes");
const chatRouter = require("./routes/chat.routes");

app.use("/uploads", express.static("uploads"));
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);

// Socket.io connection
// Socket.io connection
io.on("connection", (socket) => {
  console.log("A user connected");

  // Listen for user joining a room
  socket.on("join", (userId) => {
    socket.join(userId); // Join the user to a room based on their userId
    console.log(`User with ID ${userId} joined room`);
  });

  socket.on("send_message", (message) => {
    console.log("Message received:", message);
    // Emit the message to all connected clients
    io.emit("receive_message", message); // This sends to all clients, adjust as needed
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Basic route

app.get("/", (req, res) => {
  res.send("Backend is working!");
});

// Start the server
server.listen(Port, async () => {
  console.log(`Server is running on port ${Port}`);
  try {
    await connection;
    console.log(`Connected to the database`);
  } catch (error) {
    console.error(`Error connecting to the database: ${error.message}`);
  }
});
