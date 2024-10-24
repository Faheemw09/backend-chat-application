const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

exports.userSignup = async (req, res) => {
  const { name, email, password, bio, gender } = req.body;
  const profilePic = req.file ? req.file.filename : null;

  try {
    // Check if a user with the same email exists
    const existingEmailUser = await userModel.findOne({ email });
    if (existingEmailUser) {
      return res.status(400).json({
        message: "Email already exists.",
      });
    }

    // Check if a user with the same name exists
    const existingNameUser = await userModel.findOne({ name });
    if (existingNameUser) {
      return res.status(400).json({
        message: "Name already exists.",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 5);

    // Create a new user
    const user = new userModel({
      name,
      email,
      password: hashedPassword,
      profilePic,
      gender,
      bio,
    });

    // Save the user to the database
    await user.save();
    console.log("User saved:", user);

    // Respond with success message
    res.status(200).json({
      message: "Registered user successfully",
      data: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.userLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user with the given email exists
    const user = await userModel.findOne({ email });
    console.log("User found:", user);

    if (!user) {
      // If email is not found, send this response
      return res.status(400).send({ msg: "Email not found" });
    }

    // Compare the password
    bcrypt.compare(password, user.password, async (err, result) => {
      if (err) {
        console.error("Error comparing passwords:", err);
        return res.status(500).send({ msg: "Internal server error" });
      }

      if (result) {
        // If password matches, sign and send the token
        const token = jwt.sign({ authorID: user._id }, "chatap");

        // Construct the full URL for the profile picture
        const profilePicUrl = user.profilePic
          ? `${req.protocol}://${req.get("host")}/uploads/${user.profilePic}`
          : null;

        res.status(200).send({
          msg: "Login successful",
          token: token,
          user: {
            id: user._id,
            name: user.name, // Include any other user fields you need
            email: user.email,
            profilePic: profilePicUrl, // Return the complete URL
          },
        });
      } else {
        // If password is incorrect, send this response
        res.status(400).send({ msg: "Incorrect password" });
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.updateProfile = async (req, res) => {
  const { id } = req.params;
  const { name, email, bio, gender } = req.body;
  // console.log("Uploaded file:", req.file);
  // const profilePic = req.file ? req.file.filename : null;
  // const profilePicUrl = profilePic
  //   ? `${req.protocol}://${req.get("host")}/uploads/${profilePic}`
  //   : null;
  try {
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (bio) user.bio = bio;
    // user.profilepic =
    //   req.file && req.file.filename ? req.file.filename : user.profilepic;
    if (gender) user.gender = gender;

    await user.save();
    // console.log("File saved to:", req.file.path);

    // Construct the full image URL for the updated profile picture
    // const baseImageUrl = `${req.protocol}://${req.get("host")}/uploads`;
    // const fullImageUrl = profilePic ? `${baseImageUrl}/${profilePic}` : null;

    res.status(200).json({
      message: "User profile updated successfully",
      data: {
        ...user.toObject(),
        // profilePic: profilePicUrl,
      },
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

// exports.getAllUsers = async (req, res) => {
//   try {
//     const users = await userModel.find({});
//     res.status(200).json({
//       message: "Users retrieved successfully",
//       data: users,
//     });
//   } catch (error) {
//     console.error("Error retrieving users:", error);
//     res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// };

exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Construct the base image URL for the profile picture
    const baseImageUrl = `${req.protocol}://${req.get("host")}/uploads`;

    // Create the full image URL for the profilePic
    const fullProfilePicUrl = user.profilePic
      ? `${baseImageUrl}/${user.profilePic}`
      : null;

    res.status(200).json({
      message: "User retrieved successfully",
      data: {
        ...user.toObject(), // Convert user document to a plain object
        profilePic: fullProfilePicUrl, // Add the full profilePic URL
      },
    });
  } catch (error) {
    console.error("Error retrieving user by ID:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const userId = req.body.authorID; // This should now contain the user's ID
    // console.log(userId, "userId");

    if (!userId) {
      return res.status(400).json({ message: "User ID is undefined." });
    }

    const users = await userModel.find({ _id: { $ne: userId } });

    // Construct the base image URL for the profile pictures
    const baseImageUrl = `${req.protocol}://${req.get("host")}/uploads`;

    // Map through users and update their profilePic with full URL
    const usersWithFullImageUrl = users.map((user) => {
      return {
        ...user.toObject(),
        profilePic: user.profilePic
          ? `${baseImageUrl}/${user.profilePic}`
          : null, // Full image URL
      };
    });

    res.status(200).json({
      message: "Users retrieved successfully",
      data: usersWithFullImageUrl, // Return updated users with full image URLs
    });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.userLogout = async (req, res) => {
  const { userId } = req.body;
  y;

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
