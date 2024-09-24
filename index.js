const express = require("express");
const cors = require("cors");
const { connection } = require("./db");
const app = express();
require("dotenv").config();
const Port = process.env.PORT;
app.use(cors());
app.use(express.json());
app.listen(Port, async () => {
  console.log(`server is runing on ${Port}`);
  try {
    await connection;
    console.log(`server is connected with md`);
  } catch (error) {
    console.log(`some thing went wrong db is not connected`);
  }
});
