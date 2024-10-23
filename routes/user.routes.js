const express = require("express");
const router = express.Router();
const controller = require("../controllers/userLogin.controlllers");
const upload = require("../utils/multerConfig");
const auth = require("../middleware/AuthMiddaleware");
router.post("/user-signup", upload.single("profilePic"), controller.userSignup);
router.post("/user-signin", controller.userLogin);
router.patch(
  "/update-profile/:id",
  upload.single("profilePic"),
  controller.updateProfile
);
router.get("/user/:id", controller.getUserById);

router.delete("/delete-profile/:id", controller.deleteProfile);
router.get("/all-users", auth, controller.getAllUsers);
module.exports = router;
