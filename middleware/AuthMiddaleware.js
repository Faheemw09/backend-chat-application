const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.headers.authorization;
  if (token) {
    try {
      const decoded = jwt.verify(token.split(" ")[1], "chatap");
      console.log("Decoded token:", decoded);
      if (decoded) {
        req.body.authorID = decoded.authorID;

        console.log(req.userId, "usrr");
        next();
      } else {
        res.send({ msg: "please login ist" });
      }
    } catch (error) {
      res.status(400).send({ msg: error.message });
    }
  } else {
    res.send({ msg: "please login ist" });
  }
};
module.exports = {
  auth,
};
