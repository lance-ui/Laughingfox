function getMessageId(message) {
  if (message.reactionMessage) {
    return message.reactionMessage.key.id;
  }
  return null;
}

export default async ({ sock, event, message }) => {
  const messageId = getMessageId(event.message);
  const admins = global.client.config.admins;
  const senderID = event.senderID;

  if (admins.includes(senderID) && messageId) {
    switch (event.reaction) {
      case "👍":
        try {
          await sock.sendMessage(event.chat, { delete: event.message.reactionMessage.key });
        } catch (err) {
          console.log(err);
        }
        break;
      case "👎":
        try {
          process.exit(0);
        } catch (err) {
          console.log(err);
        }
        break;
      case "❌":
        try {
          await sock.groupLeave(event.chat);
        } catch (err) {
          console.log(err);
        }
        break;
      default:
        // Add custom reactions here if needed
        break;
    }
  }
};