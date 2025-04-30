const { google } = require("googleapis");
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = require("../lib/constant");

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  "postmessage"
);

module.exports = { oauth2Client };
