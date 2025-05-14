const jwt = require("jsonwebtoken");
const { verifyToken } = require("./helper");

exports.authMiddleware = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization || authorization === "null") {
    return res.status(403).json({ message: "Unauthorized" });
  }
  const token = authorization.startsWith("Bearer ")
    ? authorization.split(" ")[1]
    : authorization;
  try {
    const decodedToken = verifyToken(token);
    const { userId } = decodedToken;
    req.userId = userId;
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
