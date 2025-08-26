export default {
  config: {
    name: "welcome"
  },
  onEvent: async ({ event, sock, update }) => {
    const groupId = event.key.remoteJid;
    const metadata = await sock.groupMetadata(groupId);
    const botBase = sock.user.id.split(":")[0];
    const botNumberS = `${botBase}@s.whatsapp.net`;
    const botNumberLid = `${botBase}@lid`;

    for (const participant of update.participants) {
      if (
        update.action === "add" &&
        (participant === botNumberS || participant === botNumberLid)
      ) {
        const text = `Thanks for adding me to *${metadata.subject}*!\n` +
                     `Use /help to see all available commands.`;

        await sock.sendMessage(groupId, { text });
        const admins = global.client.config.admis;
        if(Array.isArray(admins)){
          for(const admin of admins){
            sock.sendMessage(String(`${admin}@s.whatsapp.net`), { text: "Bot was added to a new group" })
          }
        }
        continue; 
      }

      const username = participant.split("@")[0];
      const pp = await sock.profilePictureUrl(participant, "image").catch(() => "https://i.ibb.co/FzYpDmt/default.png");
      const memberCount = metadata.participants.length;

      if (update.action === "add") {
        const text =
          `👋 Welcome @${username} to *${metadata.subject}*! 🎉\n` +
          `You are the *${memberCount}th* member of this group.\n` +
          `Feel free to introduce yourself!`;

        await sock.sendMessage(groupId, {
          image: { url: pp },
          caption: text,
          mentions: [participant],
        });
      }

      if (update.action === "remove") {
        const text = `😢 @${username} has left *${metadata.subject}*. Farewell!`;

        await sock.sendMessage(groupId, {
          image: { url: pp },
          caption: text,
          mentions: [participant],
        });
      }
    }
  }
}