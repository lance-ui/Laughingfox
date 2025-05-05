import fs from "fs-extra";

export default {
    config: {
        name: "setpfp",
        description: "Changes the bot profile picture",
        usage: "!setpp",
        category: "owner",
        cooldown: 5,
        role: 1
    },
    onRun: async ({ message, sock, event, args, bot }) => {
        try {
            const utils = global.utils
            const quotedMessage =
                event.message.extendedTextMessage.contextInfo.quotedMessage;
            if (!quotedMessage) {
                return message.reply(
                    "Please reply to an image to set as the bot profile picture!",
                    event
                );
            }
            const media = await event.downloadMedia(quotedMessage);
            console.log("media", media);
            if (!media) {
                return message.reply("reply to image only");
            }
            const filePath = await media.save();
            await bot.changeProfilePic(filePath);
            fs.unlinkSync(filePath);
            message.reply("Bot profile picture changed successfully!");
        } catch (error) {
            console.error("Error changing bot profile picture:", error);
            message.reply("Failed to change bot profile picture!");
        }
    }
};