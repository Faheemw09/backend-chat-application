const messageModel = require("../models/message.model");
const userModel = require("../models/userModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

exports.sendMessage = async (req, res) => {
  const { sender, receiver, message } = req.body;
  try {
    const newMessage = new messageModel({
      sender,
      receiver,
      message,
    });
    await newMessage.save();

    // Emit the message via Socket.IO
    req.io.to(receiver).emit("message", {
      _id: newMessage._id,
      sender: {
        id: sender,
        name: (await userModel.findById(sender)).name, // Fetch the sender's name
        profilePic: (await userModel.findById(sender)).profilePic, // Fetch the sender's profile picture
      },
      receiver: {
        id: receiver,
      },
      message: newMessage.message,
      timestamp: newMessage.timestamp,
      read: false,
    });
    console.log("Emitted message via Socket.IO:", {
      _id: newMessage._id,
      sender: sender,
      receiver: receiver,
      message: newMessage.message,
      timestamp: newMessage.timestamp,
      read: newMessage.read,
    });

    res.status(200).json({
      message: "Message sent successfully",
      status: "success",
      data: {
        _id: newMessage._id,
        sender: {
          id: sender,
        },
        receiver: {
          id: receiver,
        },
        message: newMessage.message,
        timestamp: newMessage.timestamp,
        read: newMessage.read,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.getUserChats = async (req, res) => {
  const { userId } = req.params;
  console.log("UserId:", userId);

  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const userChats = await messageModel.aggregate([
      {
        $match: {
          $or: [{ sender: userObjectId }, { receiver: userObjectId }],
        },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", userObjectId] }, "$receiver", "$sender"],
          },
          lastMessage: { $last: "$message" },
          lastMessageDate: { $last: "$timestamp" },
          lastMessageRead: { $last: "$read" }, // Include the read status
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          lastMessageDate: 1,
          lastMessageRead: 1, // Include the read status in the response
          userName: "$userDetails.name",
          userProfilePic: "$userDetails.profilePic",
        },
      },
      {
        $sort: { lastMessageDate: -1 },
      },
    ]);

    console.log("Retrieved User Chats:", userChats);

    // Emit userChats via Socket.IO
    req.io.emit("userChats", userChats);

    res.status(200).json({
      message: "Chats retrieved successfully",
      data: userChats,
    });
  } catch (error) {
    console.error("Error retrieving chats:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.getConversation = async (req, res) => {
  const { userId, receiverId } = req.params;

  try {
    // Find conversation between the user and the receiver
    const conversation = await messageModel
      .find({
        $or: [
          { sender: userId, receiver: receiverId },
          { sender: receiverId, receiver: userId },
        ],
      })
      .sort({ timestamp: 1 })
      .populate("sender", "name profilePic")
      .populate("receiver", "name profilePic");

    // Update read status for messages where the receiver is the current user and message is unread
    await messageModel.updateMany(
      {
        sender: receiverId,
        receiver: userId,
        read: false,
      },
      { $set: { read: true } }
    );

    // Prepare the response
    const responseData = conversation.map((msg) => ({
      _id: msg._id,
      sender: {
        id: msg.sender._id,
        name: msg.sender.name,
        profilePic: msg.sender.profilePic,
      },
      receiver: {
        id: msg.receiver._id,
        name: msg.receiver.name,
        profilePic: msg.receiver.profilePic,
      },
      message: msg.message,
      timestamp: msg.timestamp,
      read: msg.read, // Include the read status
      direction: msg.sender._id.equals(userId) ? "sent" : "received",
    }));

    // Emit the conversation via Socket.IO
    req.io.emit("conversation", responseData);

    res.status(200).json({
      message: "Conversation retrieved successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Error retrieving conversation:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
