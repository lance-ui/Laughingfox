export default {
    config: {
        name: "demote",
        description: "Demote a user from admin",
        usage: ".demote <@user>",
        role: 2,
    },
    onRun: async ({ sock, event, args, message, threadID, getUserData }) => {
        let mentionedJids =
            event.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const jid = mentionedJids[0] || event.key.participant;
        console.log(jid);
        if (!jid) {
            return message.reply("Please mention the user you want to demote!");
        }

        try {
            await sock.groupParticipantsUpdate(threadID, [jid], "demote");
            const userData = await getUserData(jid);
            console.log(userData)
            const username = userData && userData.name ? userData.name : jid.split("@")[0];
            await message.reply(
                `${username} has been demoted from admin!`
            );
        } catch (error) {
            console.error(error);
            await message.reply("Failed to demote user!");
        }
    },
};