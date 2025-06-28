export default async ({ sock, event, threadID, senderID, proto }) => {
    const { replies, commands } = global.client;
    try {
        if (
            replies.has(event.message.extendedTextMessage?.contextInfo.stanzaId)
        ) {
            const { commandName, ...data} = replies.get(
                event.message.extendedTextMessage?.contextInfo.stanzaId
            );
            if (commandName) {
                const command = commands.get(commandName);
                if (command.onReply) {
                    await command.onReply({
                        sock,
                        threadID,
                        senderID,
                        proto,
                        font,
                        message,
                        bot
                    });
                }
            }
        }
    } catch (err) {
        console.log(err.message);
        message.reply(
            "failed to handle onReply please contact admin if u can so tht this is fixed immediately"
        );
    }
};
