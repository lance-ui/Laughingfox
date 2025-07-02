export default {
    config: {
        name: "tagall",
        category: "group"
    },
    async onRun({ sock, message, event, args, senderID, font }) {
        if (!args.join(" "))
            return message.reply(
                "please provide a message to share to everyone"
            );
        const groupId = event.key.remoteJid;
        if (!groupId.endsWith("@g.us")) {
            return await sock.sendMessage(groupId, {
                text: "🚫 This command can only be used in group chats."
            });
        }
        const metadata = await sock.groupMetadata(groupId);
        const participants = metadata.participants;
        const isAdmin = participants.find(p => p.id === senderID)?.admin;
        if (!isAdmin) {
            return await sock.sendMessage(groupId, {
                text: "🚫 Only group admins can use this command."
            });
        }

        const mentions = participants.map(p => p.id);
        const m = "🔈 Mentioning everyone:";
        const mentionText =
            `${m}\n\n` +
            mentions.map(u => `@${u.split("@")[0]}`).join(" ");

        const msg = await sock.sendMessage(groupId, {
            text: mentionText,
            mentions
        });
        setTimeout(() => {
            message.edit(
                `${font.bold("🔗 tagall utility")}\n${args.join(" ")}`,
                msg
            );
        }, 3000);
    }
};