const { Router } = require("express");
const { createDocument } = require("../controllers/document.controller");
const { authMiddleware } = require("../lib/middleware");
const documentRouter = Router();

documentRouter.post("/", authMiddleware, createDocument);

module.exports = documentRouter;
