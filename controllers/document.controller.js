require("dotenv").config();
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { verifyToken, generateDocumentToken } = require("../lib/helper");
const { ROLES, JWT_SECRET } = require("../lib/constant");
const client = require("../configs/redis");

exports.createDocument = async (req, res) => {
  try {
    const userId = req.userId;
    const { title = "Untitled Document", content = {} } = req.body;

    const document = await prisma.document.create({
      data: {
        title,
        content,
        owner: {
          connect: {
            id: userId,
          },
        },
      },
    });

    const docToken = jwt.sign({ docId: document.id }, JWT_SECRET);
    res
      .status(201)
      .json({ message: "Document created successfully", document, docToken });
  } catch (error) {
    console.log("Error creating document:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.changeTitle = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const document = await prisma.document.findUnique({
      where: { id: req.params.docId },
      select: { ownerId: true },
    });
    if (!document || document.ownerId !== req.userId) {
      return res.status(403).json({
        message:
          "You are not the owner of this document and cannot update its title",
      });
    }
    const { docId } = req.params;
    const { title } = req.body;

    await prisma.document.update({
      where: { id: docId },
      data: { title },
    });
    res.status(200).json({
      message: "Document title updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.accessDocument = async (req, res) => {
  try {
    const { docToken } = req.params;
    let decodedToken;
    try {
      decodedToken = verifyToken(docToken);
      if (!decodedToken) {
        return res.status(401).json({ message: "Invalid token" });
      }
    } catch (error) {
      console.error("Error in accessDocument:", error);
      return res
        .status(500)
        .json({ message: "Invalid token or token expired" });
    }

    const { docId, role = "VIEWER" } = decodedToken;

    const docMetaKey = `doc:meta:${docId}`;
    const docContentKey = `doc:content:${docId}`;

    let metadata = await client.get(docMetaKey);
    let content = await client.get(docContentKey);
    let document = null;
    if (metadata && content) {
      document = {
        ...JSON.parse(metadata),
        content: JSON.parse(content),
      };
    }

    if (!document) {
      document = await prisma.document.findUnique({
        where: { id: docId },
      });

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      await client.set(
        docMetaKey,
        JSON.stringify({
          id: document.id,
          title: document.title,
          visibility: document.visibility,
          ownerId: document.ownerId,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        })
      );

      await client.set(docContentKey, JSON.stringify(document.content));
    }

    const authHeader = req.headers.authorization || "";
    const userToken = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;
    let userId;
    try {
      const decodedUserToken = verifyToken(userToken);
      if (!decodedUserToken) {
        return res.status(401).json({ message: "Invalid token" });
      }
      userId = decodedUserToken.userId;
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(document);

    if (document.ownerId == userId) {
      return res.status(200).json({
        message: "Document found",
        document,
        role: "OWNER",
      });
    }

    if (document.visibility === "PUBLIC" && !userToken) {
      return res.status(200).json({
        message: "Document found",
        document,
        role,
      });
    }

    const existingShare = await prisma.documentShare.findFirst({
      where: {
        documentId: docId,
        userId: userId,
      },
    });

    if (existingShare) {
      return res.status(200).json({
        message: "Document found",
        document: documentFromDB,
        role: existingShare.role,
      });
    }

    await prisma.documentShare.create({
      data: {
        document: { connect: { id: docId } },
        user: { connect: { id: userId } },
        role,
      },
    });

    return res.status(200).json({
      message: "Document found",
      document: documentFromDB,
      role,
    });
  } catch (error) {
    console.error("Error in accessDocument:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
exports.getDocumentLink = async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await prisma.document.findUnique({
      where: { id: docId },
      select: {
        ownerId: true,
      },
    });
    console.log("doc", doc, " docId", docId, " req.userId", req.userId);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }
    if (doc.ownerId == req.userId) {
      const docToken = generateDocumentToken(docId, "OWNER", "2h");
      const link = `/document?token=${docToken}`;

      res.status(200).json({ message: "Document found", link });
    }
    const sharedDocument = await prisma.documentShare.findFirst({
      where: {
        documentId: docId,
        userId: req.userId,
      },
    });
    if (!sharedDocument) {
      return res
        .status(401)
        .json({ message: "The document is not shared with you." });
    }
    const docToken = generateDocumentToken(
      docId,
      sharedDocument.role || "VIEWER",
      "2h"
    );
    const link = `${process.env.FRONTEND_URL}/document?token=${docToken}`;

    res.status(200).json({ message: "Document found", link });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.generateDocumentLink = async (req, res) => {
  try {
    const { docId } = req.params;
    const { role = "VIEWER", expiresIn = "1d" } = req.query;
    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const document = await prisma.document.findUnique({
      where: { id: docId },
      select: { ownerId: true },
    });
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    if (document.ownerId !== req.userId) {
      return res.status(403).json({
        message:
          "You are not the owner of this document and cannot generate a link",
      });
    }
    const docToken = generateDocumentToken(docId, role, expiresIn);
    const link = `${process.env.FRONTEND_URL}/document?token=${docToken}`;
    res.status(200).json({ message: "Document found", link });
  } catch (error) {
    console.log(error);
  }
};

exports.getUserDocuments = async (req, res) => {
  try {
    const { page = 1, limit = 5, sortBy = "mine" } = req.query;
    let documents = [];
    if (sortBy == "mine") {
      documents = await prisma.document.findMany({
        where: { owner: { id: req.userId } },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        select: {
          id: true,
          title: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          createdAt: true,
        },
      });
    } else {
      documents = await prisma.documentShare.findMany({
        where: { userId: req.userId },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        select: {
          document: {
            select: {
              id: true,
              title: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
              createdAt: true,
            },
          },
        },
      });
      documents = documents.map((doc) => doc.document);
    }

    res.status(200).json({ message: "Documents found", documents });
  } catch (error) {
    console.log("Error creating document:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.renameDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const { title } = req.body;

    const document = await prisma.document.findUnique({
      where: { id: docId },
      select: { ownerId: true },
    });

    if (!document || document.ownerId !== req.userId) {
      return res.status(401).json({
        message:
          "You are not the owner of this document and cannot update its title",
      });
    }

    await prisma.document.update({
      where: { id: docId },
      data: { title },
    });

    res.status(200).json({
      message: "Document title updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const { docId } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: docId },
      select: { ownerId: true },
    });

    if (!document || document.ownerId !== req.userId) {
      return res.status(401).json({
        message: "You are not the owner of this document and cannot delete it",
      });
    }

    await prisma.document.delete({
      where: { id: docId },
    });

    res.status(200).json({
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
