const { Router } = require("express");
const authRouter = require("./auth.router");
const documentRouter = require("./document.router");
const router = Router();

router.use("/auth", authRouter);
router.use("/document", documentRouter);

module.exports = router;
