function getStanzaId(message) {
    if (
        message.extendedTextMessage &&
        message.extendedTextMessage.contextInfo
    ) {
        return message.extendedTextMessage.contextInfo.stanzaId;
    } else if (message.imageMessage && message.imageMessage.contextInfo) {
        return message.imageMessage.contextInfo.stanzaId;
    } else if (message.stickerMessage && message.stickerMessage.contextInfo) {
        return message.stickerMessage.contextInfo.stanzaId;
    } else if (message.videoMessage && message.videoMessage.contextInfo) {
        return message.videoMessage.contextInfo.stanzaId;
    } else if (message.contextInfo) {
        return message.contextInfo.stanzaId;
    }
    return null;
}

export default async ({
    sock,
    event,
    threadID,
    senderID,
    proto,
    font,
    message,
    bot,
    args
}) => {
    const { replies, commands } = global.client;
    try {
        const stanzaId = getStanzaId(event.message);
        if (stanzaId && replies.has(stanzaId)) {
            const data = replies.get(stanzaId);
            if (data && data.commandName) {
                const command = commands.get(data.commandName);
                if (command && command.onReply) {
                    await command.onReply({
                        sock,
                        threadID,
                        senderID,
                        proto,
                        font,
                        message,
                        bot,
                        args,
                        data
                    });
                }
            }
        }
    } catch (err) {
        console.log(err);
        message.reply(
            "Failed to handle onReply. Please contact admin so that this is fixed immediately."
        );
    }
};
