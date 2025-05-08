const client = require("../configs/redis");
const { generateAnonName, getRandomAvatar } = require("../lib/anonUser");

exports.handleSocketDocJoin = (io, socket) => {
  socket.on("join", async ({ docId, userId, name, avatar, role }) => {
    try {
      const id = userId || `anon-${socket.id}`;
      const presenceKey = `activeUsers:${docId}`;
      const presence = {
        id,
        name: name || generateAnonName(),
        avatar: avatar || getRandomAvatar(),
        role: role || "VIEWER",
        isAnonymous: !userId,
      };

      await client.sAdd(presenceKey, JSON.stringify(presence));
      socket.join(docId);

      const members = await client.sMembers(presenceKey);
      io.to(docId).emit("presence:update", members.map(JSON.parse));
    } catch (error) {
      console.error("Join error:", error);
    }
  });

  socket.on("leave", async ({ docId, userId }) => {
    try {
      const id = userId || `anon-${socket.id}`;
      const presenceKey = `activeUsers:${docId}`;
      const members = await client.sMembers(presenceKey);

      for (const member of members) {
        const parsed = JSON.parse(member);
        if (parsed.id === id) {
          await client.sRem(presenceKey, member);
          break;
        }
      }

      socket.leave(docId);

      const updatedMembers = await client.sMembers(presenceKey);
      io.to(docId).emit("presence:update", updatedMembers.map(JSON.parse));
    } catch (error) {
      console.error("Leave error:", error);
    }
  });
};
