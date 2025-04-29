const { Router } = require("express");
const authRouter = require("./auth.router");
const documentRouter = require("./document.router");
const { authMiddleware } = require("../lib/middleware");
const router = Router();

router.use("/auth", authRouter);
router.use("/document", documentRouter);

module.exports = router;
