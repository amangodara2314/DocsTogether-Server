const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const createDocument = async (req, res) => {
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
