import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export default {
    config: {
        name: "admins",
        description: "Add, remove, or list bot admins",
        usage: ".admins add <@user>\n.admins remove <@user>\n.admins list",
        role: 1,
        category: "admin"
    },
    onRun: async ({ event, args, message, getUserData }) => {
        const subcmd = (args[0] || "").toLowerCase();
        let mentionedJids =
            event.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const sender = event.key.participant || event.key.remoteJid;

        if (!global.client.config.admins) global.client.config.admins = [];

        const saveConfig = () => {
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const configPath = path.join(__dirname, "../../config.json");
            try {
                const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
                config.admins = global.client.config.admins;
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            } catch (e) {
                message.reply("Failed to update config.json.");
            }
        };

        if (subcmd === "add") {
            const jid = mentionedJids[0];
            if (!jid) return message.reply("Mention a user to add as admin.");
            if (global.client.config.admins.includes(jid))
                return message.reply("User is already an admin.");
            global.client.config.admins.push(jid.split("@")[0]);
            saveConfig();
            await message.reply("User added as bot admin.");
        } else if (subcmd === "remove") {
            const jid = mentionedJids[0];
            if (!jid) return message.reply("Mention a user to remove as admin.");
            if (!global.client.config.admins.includes(jid))
                return message.reply("User is not an admin.");
            global.client.config.admins = global.client.config.admins.filter(a => a !== jid);
            saveConfig();
            await message.reply("User removed from bot admins.");
        } else if (subcmd === "list") {
            if (global.client.config.admins.length === 0)
                return message.reply("No bot admins set.");
            let adminList = [];
            for (const jid of global.client.config.admins) {
                const userData = await getUserData(jid);
                console.log(userData)
                const name = userData && userData.name ? userData.name : jid.split("@")[0];
                adminList.push(`• ${name}`);
            }
            await message.reply(
                `Bot Admins:\n${adminList.join("\n")}`,
            );
        } else {
            await message.reply(
                "Usage:\n.admins add <@user>\n.admins remove <@user>\n.admins list"
            );
        }
    },
};