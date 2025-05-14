const { Router } = require("express");
const {
  createDocument,
  accessDocument,
  getDocumentLink,
  getUserDocuments,
  getSharedDocuments,
  generateDocumentLink,
  renameDocument,
  deleteDocument,
} = require("../controllers/document.controller");
const { authMiddleware } = require("../lib/middleware");
const documentRouter = Router();

documentRouter.get(
  "generate-link/:docId",
  authMiddleware,
  generateDocumentLink
);

documentRouter.get("/link/:docId", authMiddleware, getDocumentLink);

documentRouter.get("/", authMiddleware, getUserDocuments);

documentRouter.get("/join/:docToken", accessDocument);

documentRouter.post("/", authMiddleware, createDocument);

documentRouter.patch("/rename/:docId", authMiddleware, renameDocument);

documentRouter.delete("/:docId", authMiddleware, deleteDocument);

module.exports = documentRouter;
