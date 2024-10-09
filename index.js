const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");
const { connection } = require("./db");

require("dotenv").config();
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const Port = process.env.PORT;
app.use(cors());
app.use(express.json());

const userRouter = require("./routes/user.routes");
const chatRouter = require("./routes/chat.routes");

app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);

io.on("connection", (socket) => {
  console.log("new client connected", socket.id);

  socket.on("chatMessage", (msgData) => {
    io.emit("message", msgData);
  });
  socket.on("disconnect", () => {
    console.log("client disconnected", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Backend is working!");
});
app.listen(Port, async () => {
  console.log(`server is runing on ${Port}`);
  try {
    await connection;
    console.log(`server is connected with md`);
  } catch (error) {
    console.log(`some thing went wrong db is not connected`);
  }
});
