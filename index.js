require("dotenv").config();
const express = require("express");
const cors = require("cors");
const router = require("./routers/routes");
const client = require("./configs/redis");
const appEmitter = require("./configs/emitter");
const { handleSocketDocJoin } = require("./socketHandlers/joinDoc");
const { handleDocUpdate } = require("./socketHandlers/updateDoc");
const app = express();
const Server = require("socket.io").Server;
const httpServer = require("http").createServer(app);
const io = new Server(httpServer);
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.use("/api/", router);

httpServer.listen(PORT, async () => {
  await client.connect();

  console.log(`Server started on port ${PORT}`);
});

io.on("connection", (socket) => {
  console.log("A user connected " + socket.id);
  handleSocketDocJoin(io, socket);
  handleDocUpdate(io, socket);
});
