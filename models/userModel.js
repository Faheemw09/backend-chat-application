const mongoose = require("mongoose");
const userSchema = mongoose.Schema({
  name: {
    type: String,
    default: null,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePic: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    default: null,
  },
  created_ts: {
    type: Date,
    default: Date.now,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("User", userSchema);
