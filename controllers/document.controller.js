require("dotenv").config();
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { verifyToken, generateDocumentToken } = require("../lib/helper");
const { ROLES, JWT_SECRET } = require("../lib/constant");

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
    const decodedToken = jwt.verify(docToken, JWT_SECRET);
    const { docId, role = "VIEWER" } = decodedToken;
    const document = await prisma.document.findUnique({
      where: { id: docId },
    });
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    const authHeader = req.headers.authorization || "";

    const userToken = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    if (document.visibility == "PUBLIC" && !userToken) {
      return res
        .status(200)
        .json({ message: "Document found", document, role });
    }
    const { userId = "" } = verifyToken(userToken);
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
        document,
        role: existingShare.role,
      });
    }
    await prisma.documentShare.create({
      data: {
        document: {
          connect: {
            id: document.id,
          },
        },
        user: {
          connect: {
            id: user.id,
          },
        },
        role,
      },
    });
    return res.status(200).json({ message: "Document found", document, role });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getDocumentLink = async (req, res) => {
  try {
    const { docId } = req.params;
    const sharedDocument = await prisma.documentShare.findFirst({
      where: { documentId: docId, userId: req.userId },
    });
    if (sharedDocument) {
      const docToken = generateDocumentToken(docId, sharedDocument.role, "2h");
      const link = `${process.env.FRONTEND_URL}/link/${docToken}`;

      res.status(200).json({ message: "Document found", link });
    } else {
      res.status(404).json({ message: "Document not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.generateDocumentLink = async (req, res) => {
  try {
    const { docId } = req.params;
    const { role = "VIEWER", expiresIn = "7d" } = req.query;
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
          "You are not the owner of this document and cannot generate a link for it",
      });
    }
    const docToken = generateDocumentToken(docId, role, expiresIn);
    const link = `${process.env.FRONTEND_URL}/link/${docToken}`;
    res.status(200).json({ message: "Document found", link });
  } catch (error) {
    console.log(error);
  }
};

exports.getUserDocuments = async (req, res) => {
  try {
    const { page = 1, pageSize = 5 } = req.query;
    const documents = await prisma.document.findMany({
      where: { owner: { id: req.userId } },
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize),
    });

    res.status(200).json({ message: "Documents found", documents });
  } catch (error) {
    console.log("Error creating document:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getSharedDocuments = async (req, res) => {
  try {
    const { page = 1, pageSize = 5 } = req.query;
    const documents = await prisma.documentShare.findMany({
      where: { userId: req.userId },
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize),
      select: {
        document: true,
      },
    });

    res.status(200).json({ message: "Documents found", documents });
  } catch (error) {
    console.log("Error creating document:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
