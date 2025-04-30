require("dotenv").config();
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./constant");

exports.verifyToken = (token) => {
  const decodedToken = jwt.verify(token, JWT_SECRET);
  return decodedToken;
};

exports.generateDocumentToken = (docId, role = "VIEWER", expiresIn = "7d") => {
  const token = jwt.sign({ docId, role }, JWT_SECRET, {
    expiresIn,
  });
  return token;
};
