export default {
  config: {
    name: "promote",
    description: "Promote a user to admin",
    usage: ".promote <@user>",
    role: 2,
  },
  onRun: async ({ sock, event, args, message, threadID }) => {
    if (!args[0]) {
      return message.reply("Please mention the user you want to promote!");
    }

    const jid = event.mentions[0] || event.key.participant;
      console.log(jid)
    if (!jid) {
      return message.reply("Invalid user!");
    }

    try {
      await sock.groupParticipantsUpdate(threadID, [jid], "promote");
      await message.reply(`@${jid.split("@")[0]} has been promoted to admin!`, {
        mentions: [jid],
      });
    } catch (error) {
      console.error(error);
      await message.reply("Failed to promote user!");
    }
  },
};