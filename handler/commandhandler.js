async function handler({
  args,
  event,
  sock,
  senderID,
  threadID,
  commandName,
  bot,
  message,
  font
}) {
  try {
    const { config, cooldowns } = global.client;
    const command = await global.client.commands.get(commandName.toLowerCase());
    /**
     * handle cooldown here
     */
    const now = Date.now();
    const cooldownKey = `${senderID}_${commandName.toLowerCase()}`;
    const cooldownTime = command.config.cooldown || 0;
    const cooldownExpiration = cooldowns[cooldownKey] || 0;
    const secondsLeft = Math.ceil((cooldownExpiration - now) / 1000);
    if (cooldownExpiration && now < cooldownExpiration) {
      return message.send(
        `❌ | Please wait ${secondsLeft}s to use this command!`
      );
    }
    cooldowns[cooldownKey] = now + cooldownTime * 1000;
    /**
     * handle roles here
     */
    const metadata = await sock.groupMetadata(threadID);
    const groupAdmins = metadata.participants
      .filter((ad) => ad.admin !== null)
      .map((uid) => uid.id);
    const role = command.config?.role || 0;
    if (role == 1) {
      if (
        !senderID.replace("@s.whatsapp.net", "").includes(config.admins)
      ) {
        return message.reply(
          "❌ | the command that you are using can only be used by bot admins"
        );
      }
    }
    if (role == 2) {
      if (threadID.endsWith("@g.us")) {
        if (!senderID.includes(groupAdmins)) {
          return message.reply(
            "❌ | the command that you are using can only be used by group admins"
          );
        }
      } else {
        message.reply(
          "❌ | the command that you are using can only be used in groups"
        );
      }
    }

    return await command.onRun({
      sock,
      event,
      args,
      threadID,
      senderID,
      font,
      commandName,
      message,
      bot,
      groupAdmins,
    });
  } catch (e) {
    message.reply(
      `❌ | an error occured while executing the command: " ${e.message}`
    );
    throw new Error(e);
  }
};

export default handler;
