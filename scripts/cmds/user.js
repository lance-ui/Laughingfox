export default {
    config: {
        name: "user",
        description: "Ban or unban a user from using the bot",
        usage: ".user <@user> ban|-b or .user <@user> unban|-un",
        role: 1,
        category: "admin"
    },
    onRun: async ({ event, args, message, setUserBanned }) => {
        let mentionedJids =
            event.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const jid = mentionedJids[0];

        if (!jid) {
            return message.reply(
                "Please mention the user you want to ban or unban."
            );
        }

        const action = (args[1] || "").toLowerCase();
        if (action === "ban" || action === "-b") {
            await setUserBanned(jid, true);
            await message.reply(
                `@${jid.split("@")[0]} has been banned from using the bot.`,
                {
                    mentions: [jid]
                }
            );
        } else if (action === "unban" || action === "-un") {
            await setUserBanned(jid, false);
            await message.reply(`@${jid.split("@")[0]} has been unbanned.`, {
                mentions: [jid]
            });
        } else {
            await message.reply(
                "Usage: .user <@user> ban|-b or .user <@user> unban|-un"
            );
        }
    }
};
