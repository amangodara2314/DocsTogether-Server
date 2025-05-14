const { Router } = require("express");
const {
  register,
  verifyUser,
  login,
  googleAuth,
  getUserDetails,
} = require("../controllers/auth.controller");
const { authMiddleware } = require("../lib/middleware");
const authRouter = Router();

authRouter.get("/user", authMiddleware, getUserDetails);
authRouter.get("/verify-email", verifyUser);
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/google/:code", googleAuth);

module.exports = authRouter;
