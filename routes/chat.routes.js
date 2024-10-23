const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");
const { default: lookup } = require("socket.io-client");

router.post("/send-message", chatController.sendMessage);
router.get("/get-chats/:userId", chatController.getUserChats);
router.get(
  "/get-conversation/:userId/:receiverId",
  chatController.getConversation
);

module.exports = router;
