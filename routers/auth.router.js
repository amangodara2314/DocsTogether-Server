const { Router } = require("express");
const {
  register,
  verifyUser,
  login,
} = require("../controllers/auth.controller");
const authRouter = Router();

authRouter.get("/verify-email", verifyUser);
authRouter.post("/register", register);
authRouter.post("/login", login);

module.exports = authRouter;
