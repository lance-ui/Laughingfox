export default {
  config: {
    name: "promote",
    description: "Promote a user to admin",
    usage: ".promote <@user>",
    role: 2,
  },
  onRun: async ({ sock, event, args, message, threadID, getUserData }) => {
    let mentionedJids =
      event.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const jid = mentionedJids[0] || event.key.participant;

    if (!jid) {
      return message.reply("Please mention the user you want to promote!");
    }

    try {
      await sock.groupParticipantsUpdate(threadID, [jid], "promote");
      const userData = await getUserData(jid);
      const username = userData && userData.name ? userData.name : jid.split("@")[0];
      await message.reply(
        `${username} has been promoted to admin!`
      );
    } catch (error) {
      console.error(error);
      await message.reply("Failed to promote user!");
    }
  },
};