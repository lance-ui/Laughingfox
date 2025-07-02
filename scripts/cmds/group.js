export default {
  config: {
    name: "group",
    author: "JARiF",
    version: "1.0",
    aliase: ["thread"],
    role: 2,
    description: "Opens the group so everyone can send messages",
    category: "group",
  },

  async onRun({ sock, event, message, args }) {
    const groupId = event.key.remoteJid;

    try {
      switch (args[0].toLowerCase()) {
        case "open":
        case "-o":
          await sock.groupSettingUpdate(groupId, "not_announcement");
          await sock.sendMessage(groupId, {
            text: "✅ Group has been opened. Everyone can send messages now.",
          });
          break;
        case "close":
        case "-c":
          await sock.groupSettingUpdate(groupId, "announcement");
          await message.reply(
            "✅ Group has been closed. Only admins can send messages now."
          );
          break;
        default:
          message.reply(
            "unknown action used if you want the one you used to be included please contact the bot dev"
          );
          break;
      }
    } catch (err) {
      console.error("Failed to open group:", err);
      await sock.sendMessage(groupId, {
        text: "❌ Failed to open group. Please try again later.",
      });
    }
  },
};
