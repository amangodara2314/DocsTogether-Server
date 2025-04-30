const { Router } = require("express");
const {
  register,
  verifyUser,
  login,
  googleAuth,
} = require("../controllers/auth.controller");
const authRouter = Router();

authRouter.get("/verify-email", verifyUser);
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/google/:code", googleAuth);

module.exports = authRouter;
