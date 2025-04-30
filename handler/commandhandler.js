export default async ({
  args,
  event,
  sock,
  senderID,
  threadID,
  commandName,
  bot,
  message,
}) => {
  try {
    const command = await global.client.commands.get(commandName.tolowerCase());
    /**
     * handle onChat here
     */
    for (const [key, value] of Object.entries(global.client.commands)) {
      if (key.onChat) {
        await key.onChat({
          args,
          event,
          sock,
          senderID,
          threadID,
          commandName,
          bot,
          message,
        });
      }
    }
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
        !senderID.replace("@s.whatsapp.net", "").includes(botadmin) ||
        !senderID.includes(devs)
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
      log,
      font,
      commandName,
      message,
      bot,
      Users,
      Threads,
      groupAdmins,
    });
  } catch (e) {
    message.reply(
      `❌ | an error occured while executing the command: " ${err.message}`
    );
    throw new Error(e);
  }
};
