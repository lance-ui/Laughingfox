export default {
  config: {
    name: "respect",
    aliase: ["honor", "makeadmin"],
    description: "Promote the command sender to admin if bot is admin.",
    role: 1,
    author: "lance",
    category: "GROUP",
  },

  async onRun({ sock, event, senderID }) {
    const jid = event.key.remoteJid;
    try {
      await sock.groupParticipantsUpdate(jid, [senderID], "promote");
      return await sock.sendMessage(jid, {
        text: `✅ RESPECT! You have been promoted to admin.`,
      });
    } catch (e) {
      return await sock.sendMessage(jid, {
        text: "❌ Failed to promote you to admin. Make sure I have admin rights.",
      });
    }
  },
};
