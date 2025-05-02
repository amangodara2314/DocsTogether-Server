const jwt = require("jsonwebtoken");

exports.authMiddleware = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  const token = authorization.startsWith("Bearer ")
    ? authorization.split(" ")[1]
    : authorization;
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const { userId } = decodedToken;
    req.userId = userId;
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
