export default {
  config: {
    name: "kick",
    author: "lance",
    version: "1.0",
    aliase: ["remove"],
    description: "Kick someone from the group by replying to their message.",
    role: 2,
    category: "group",
  },
  onRun: async function ({ sock, event, message }) {
    const groupId = event.key.remoteJid;
    const target = event.message?.extendedTextMessage?.contextInfo?.participant;

    if (!target) {
      return sock.sendMessage(
        groupId,
        { text: "⚠️ Please reply to the user's message you want to kick." },
        { quoted: event }
      );
    }

    const metadata = await sock.groupMetadata(groupId);
    const participants = metadata.participants;

    const targetInfo = participants.find((p) => p.id === target);
    if (!targetInfo) {
      return sock.sendMessage(
        groupId,
        { text: "❌ Couldn't find the user in this group." },
        { quoted: event }
      );
    }

    const isBotadmin = global.client.config.admins.includes(
      target.split("@")[0]
    );
    if (isBotadmin) {
      message.reply("bot cannot kick bot admin");
    }
    const isTargetAdmin =
      targetInfo.admin === "admin" || targetInfo.admin === "superadmin";
    if (isTargetAdmin) {
      return sock.sendMessage(
        groupId,
        { text: "🚫 Can't kick a group admin." },
        { quoted: event }
      );
    }

    if (target === sock.user.id) {
      return sock.sendMessage(
        groupId,
        { text: "❌ I won't kick myself." },
        { quoted: event }
      );
    }

    try {
      await sock.groupParticipantsUpdate(groupId, [target], "remove");

      const username = target.split("@")[0];
      await sock.sendMessage(
        groupId,
        {
          text: `✅ @${username} has been kicked from the group.`,
          mentions: [target],
        },
        { quoted: event }
      );
    } catch (err) {
      console.error("Kick error:", err);
      await sock.sendMessage(
        groupId,
        { text: "❌ Failed to kick the user." },
        { quoted: event }
      );
    }
  },
};
