const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const upload = require("../utils/multerConfig");

exports.userSignup = async (req, res) => {
  const { name, email, password, bio } = req.body;
  const profilePic = req.file ? req.file.filename : null;
  try {
    const existingUser = await userModel.findOne({
      $or: [{ email }, { name }],
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          "Email or name already exists. Please use a different email or name.",
      });
    }
    bcrypt.hash(password, 5, async (err, hash) => {
      const user = new userModel({
        name,
        email,
        password: hash,
        profilePic,
        bio,
      });
      await user.save();
      console.log("User saved:", user);

      res.status(200).json({
        message: "Register user sucessfully",
        data: user,
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "internal server error",
    });
  }
};

exports.userLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });
    console.log("User found:", user);

    if (!user) {
      return res.status(400).send({ msg: "wrong credentials" });
    }

    // Compare password
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        console.error("Error comparing passwords:", err);
        return res.status(500).send({ msg: "Internal server error" });
      }

      if (result) {
        const token = jwt.sign({ authorID: user._id }, "chatap");
        res.status(200).send({ msg: "login successful", token: token });
      } else {
        res.status(400).send({ msg: "wrong credentials" });
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Internal server Error",
    });
  }
};

exports.updateProfile = async (req, res) => {
  const { id } = req.params;
  const { name, email, bio } = req.body;
  const profilePic = req.file ? req.file.filename : null;

  try {
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (bio) user.bio = bio;
    if (profilePic) user.profilePic = profilePic;

    await user.save();

    res.status(200).json({
      message: "User profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteProfile = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await userModel.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User profile deleted successfully",
      data: user,
    });
  } catch (error) {
    console.error("Delete profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find({});
    res.status(200).json({
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error retrieving user by ID:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
exports.userLogout = async (req, res) => {
  const { userId } = req.body; // assuming userId is sent in the request body

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user's online status

    res.status(200).json({
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
