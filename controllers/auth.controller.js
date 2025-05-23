const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");
const { SALT_ROUNDS } = require("../lib/constant");
const { sendVerificationEmail } = require("../lib/mailer");
const jwt = require("jsonwebtoken");
const client = require("../configs/redis");
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });
    const verificationToken = jwt.sign(
      { email: user.email, id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );
    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Unable to send verification email" });
    }

    res
      .status(201)
      .json({ message: "Verification link has been sent to your email" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const verifyUser = async (req, res) => {
  try {
    const { token: userToken } = req.query;
    if (!userToken) {
      return res.status(400).json({ message: "Invalid token" });
    }
    const decodedToken = jwt.verify(userToken, process.env.JWT_SECRET);
    const { email, id } = decodedToken;
    const user = await prisma.user.update({
      where: { email: email, id: id },
      data: { isVerified: true },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

    res.status(200).json({ message: "Email verified successfully", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email } });
    if (!user) {
      return res.status(404).json({ message: "Email does not exists." });
    }
    if (!user.isVerified) {
      const userToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET);
      try {
        await sendVerificationEmail(user.email, user.name, userToken);
      } catch (error) {
        console.log(error);
        return res
          .status(500)
          .json({ message: "Unable to send verification email" });
      }
      return res.status(401).json({
        message: "Email is not verified. Verification email sent successfully",
      });
    }
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res
      .status(200)
      .json({ message: `Welcome ${user.name} to DocsTogether`, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { code } = req.params;
    const googleResult = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(googleResult.tokens);

    const userResult = await fetch(
      "https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=" +
        googleResult.tokens.access_token
    );
    const userInfo = await userResult.json();
    const existingUser = await prisma.user.findUnique({
      email: userInfo.email,
    });
    if (existingUser) {
      const token = jwt.sign(
        { userId: existingUser.id },
        process.env.JWT_SECRET
      );
      return res
        .status(200)
        .json({ message: "User logged in successfully", token });
    }
    const user = await prisma.user.create({
      data: {
        email: userInfo.email,
        name: userInfo.name,
        avatar: userInfo.picture,
        isGoogleLogin: true,
        isVerified: true,
      },
    });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res
      .status(200)
      .json({ message: `Welcome ${user.name} to DocsTogether`, token });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const userId = req.userId;
    const userCacheKey = `users:${userId}`;
    const cachedUser = await client.get(userCacheKey);
    if (cachedUser) {
      console.log("Cache hit");
      return res
        .status(200)
        .json({ message: "User found", user: JSON.parse(cachedUser) });
    }
    console.log("Cache miss");
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatar: true },
    });
    if (!user) {
      return res
        .status(403)
        .json({ message: "User does not exist. Please login again" });
    }
    await client.set(userCacheKey, JSON.stringify(user), {
      EX: 60 * 10,
    });
    res.status(200).json({ message: "User found", user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
module.exports = { register, verifyUser, login, googleAuth, getUserDetails };
