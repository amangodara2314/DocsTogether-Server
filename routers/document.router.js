const { Router } = require("express");
const {
  createDocument,
  accessDocument,
  getDocumentLink,
  getUserDocuments,
  getSharedDocuments,
  generateDocumentLink,
} = require("../controllers/document.controller");
const { authMiddleware } = require("../lib/middleware");
const documentRouter = Router();

documentRouter.get(
  "generate-link/:docId",
  authMiddleware,
  generateDocumentLink
);
documentRouter.get("/link/:docId", authMiddleware, getDocumentLink);

documentRouter.get(
  "shared-documents/:docId",
  authMiddleware,
  getSharedDocuments
);
documentRouter.get("/", authMiddleware, getUserDocuments);

documentRouter.get("/join/:docToken", accessDocument);

documentRouter.post("/", authMiddleware, createDocument);

module.exports = documentRouter;
