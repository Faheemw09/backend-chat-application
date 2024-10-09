const messageModel = require("../models/message.model");
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
    res.status(200).json({
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Ensure this points to your actual message model

// Ensure you have a user model to get user details

exports.getUserChats = async (req, res) => {
  const { userId } = req.params;
  console.log("UserId:", userId); // Log the incoming userId

  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    console.log("User ObjectId:", userObjectId);

    const userChats = await messageModel.aggregate([
      {
        // Match messages sent to or received from the user
        $match: {
          $or: [{ sender: userObjectId }, { receiver: userObjectId }],
        },
      },
      {
        // Group messages by sender or receiver
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", userObjectId] },
              "$receiver", // If the user is the sender, group by receiver
              "$sender", // If the user is the receiver, group by sender
            ],
          },
          lastMessage: { $last: "$message" }, // Get the last message
          lastMessageDate: { $last: "$timestamp" }, // Get the date of the last message
        },
      },
      {
        // Lookup user details based on the grouped ID
        $lookup: {
          from: "users", // Ensure this matches your collection name
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        // Unwind userDetails to flatten the structure
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true, // If no user details are found, still return the chat
        },
      },
      {
        // Project the desired fields for the response
        $project: {
          _id: 1,
          lastMessage: 1,
          lastMessageDate: 1,
          userName: "$userDetails.name", // Assuming the user has a `name` field
          userProfilePic: "$userDetails.profilePic", // Assuming the user has a `profilePic` field
        },
      },
      {
        // Optionally, sort the results by lastMessageDate descending
        $sort: { lastMessageDate: -1 },
      },
    ]);

    console.log("Retrieved User Chats:", userChats);

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

// Update with the actual path to your User model

exports.getConversation = async (req, res) => {
  const { userId, receiverId } = req.params;
  try {
    // Fetch the conversation between the two users
    const conversation = await messageModel
      .find({
        $or: [
          { sender: userId, receiver: receiverId },
          { sender: receiverId, receiver: userId },
        ],
      })
      .sort({ timestamp: 1 });

    // Collect sender and receiver IDs
    const senderIds = conversation.map((msg) => msg.sender);
    const receiverIds = conversation.map((msg) => msg.receiver);

    // Fetch sender and receiver details
    const senders = await User.find({ _id: { $in: senderIds } }).lean();
    const receivers = await User.find({ _id: { $in: receiverIds } }).lean();

    // Create a map for quick lookup
    const senderMap = senders.reduce((acc, user) => {
      acc[user._id] = { name: user.name, profilePic: user.profilePic };
      return acc;
    }, {});

    const receiverMap = receivers.reduce((acc, user) => {
      acc[user._id] = { name: user.name, profilePic: user.profilePic };
      return acc;
    }, {});

    // Construct the response data
    const responseData = conversation.map((msg) => ({
      _id: msg._id,
      sender: {
        id: msg.sender,
        name: senderMap[msg.sender]?.name,
        profilePic: senderMap[msg.sender]?.profilePic,
      },
      receiver: {
        id: msg.receiver,
        name: receiverMap[msg.receiver]?.name,
        profilePic: receiverMap[msg.receiver]?.profilePic,
      },
      message: msg.message,
      timestamp: msg.timestamp,
    }));

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
