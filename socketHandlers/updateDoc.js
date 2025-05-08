const client = require("../configs/redis");

exports.handleDocUpdate = async (io, socket) => {
  socket.on("update", async ({ docId, content }) => {
    try {
      const presenceKey = `doc:content:${docId}`;
      await client.set(presenceKey, JSON.stringify(content));
      socket.broadcast.to(docId).emit("doc:update", content);
    } catch (error) {
      console.error("Join error:", error);
    }
  });
};
