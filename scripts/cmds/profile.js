export default {
    config: {
        name: "profile",
        description:
            "Get profile picture of yourself, replied user or mentioned user",
        usage: "profile [mention or reply]",
        aliase: ["pfp"],
        role: 1,
        category: "utility"
    },

    async onRun({ sock, event }) {
        try {
            let userId;

            const contextInfo = event.message?.extendedTextMessage?.contextInfo;

            if (contextInfo?.mentionedJid?.length > 0) {
                userId = contextInfo.mentionedJid[0];
            } else if (contextInfo?.participant) {
                userId = contextInfo.participant;
            } else {
                userId = event.key.participant || event.key.remoteJid;
            }

            const ppUrl = await sock
                .profilePictureUrl(userId, "image")
                .catch(() => null);

            if (!ppUrl) {
                return await sock.sendMessage(event.key.remoteJid, {
                    text: "⚠️ Profile picture not found or user has no profile photo."
                });
            }

            await sock.sendMessage(event.key.remoteJid, {
                image: { url: ppUrl },
                caption: `🖼️ Profile picture of @${userId.split("@")[0]}`,
                contextInfo: { mentionedJid: [userId] }
            });
        } catch (err) {
            console.error("❌ Error in profile command:", err);
            await sock.sendMessage(event.key.remoteJid, {
                text: "❌ Failed to get profile picture."
            });
        }
    }
};
