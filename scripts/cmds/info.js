import moment from "moment-timezone";
export default {
    config: {
        name: "info",
        aliases: ["info", "owner", "botinfo"],
        author: "lance",
        countDown: 5,
        role: 0,
        category: "utility"
    },

    onRun: async function ({ message, client, event }) {
        const botName = "sypher™";
        const version = "1.0.0";
        const authorName = "Läñ çëq";
        const authorFB = "not set";
        const authorInsta = "not set";
        const authorEmail = "engombe440@gmail.com";
        const authorGithub = "https://github.com/lance-ui";
        const status = "Advanced AI Assistant";

        const startTime = Date.now();

        try {
            const now = moment().tz("Africa/Lusaka");
            const date = now.format("MMMM Do YYYY");
            const time = now.format("h:mm:ss A");
            const uptime = process.uptime();
            const ping = Date.now() - startTime;

            const replyMessage = `
╔════ ≪ °❈° ≫ ════╗
     BOT & OWNER INFO
╚════ ≪ °❈° ≫ ════╝

┏━━━━━━━━━━━━━━━┓
┣ Bot Name: ${botName}
┣ Version: ${version}
┣ Prefix: ${global.client.config.PREFIX}
┣ Author: ${authorName}
┣ Facebook: ${authorFB}
┣ Instagram: ${authorInsta}
┣ Email: ${authorEmail}
┣ GitHub: ${authorGithub}
┣ Status: ${status}
┗━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━┓
┣ Date: ${date}
┣ Time: ${time}
┣ Uptime: ${formatUptime(uptime)}
┣ Ping: ${ping}ms
┗━━━━━━━━━━━━━━━┛

© 2025 ${authorName} | All rights reserved.
`;

            message.reply(replyMessage);
        } catch (error) {
            console.error("Error in info command:", error);
            message.reply(
                `An error occurred while fetching information. Please try again later.`
            );
        }
    }
};

function formatUptime(uptime) {
    const seconds = Math.floor(uptime % 60);
    const minutes = Math.floor((uptime / 60) % 60);
    const hours = Math.floor((uptime / (60 * 60)) % 24);
    const days = Math.floor(uptime / (60 * 60 * 24));

    const uptimeString = [];
    if (days > 0) uptimeString.push(`${days}d`);
    if (hours > 0) uptimeString.push(`${hours}h`);
    if (minutes > 0) uptimeString.push(`${minutes}m`);
    if (seconds > 0) uptimeString.push(`${seconds}s`);

    return uptimeString.join(" ");
}