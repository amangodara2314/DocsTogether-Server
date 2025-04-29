require("dotenv").config();
const nodemailer = require("nodemailer");
const { VERIFICATION_HTML } = require("./constant");

exports.sendVerificationEmail = async (to, name, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    logger: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: "Verify your email address",
    html: VERIFICATION_HTML.replace("{{VERIFY_LINK}}", verifyUrl),
  };

  await transporter.sendMail(mailOptions);
};
