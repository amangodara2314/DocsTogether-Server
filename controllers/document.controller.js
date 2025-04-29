const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

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

    const docToken = jwt.sign({ docId: document.id }, process.env.JWT_SECRET);
    res
      .status(201)
      .json({ message: "Document created successfully", document, docToken });
  } catch (error) {
    console.log("Error creating document:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getDocument = async (req, res) => {
  try {
    const { docToken } = req.params;
    const decodedToken = jwt.verify(docToken, process.env.JWT_SECRET);
    const { docId } = decodedToken;

    const document = await prisma.document.findUnique({
      where: { id: docId },
    });
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "Document found", document });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
