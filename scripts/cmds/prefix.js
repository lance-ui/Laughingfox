import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export default {
  config: {
    name: "prefix",
    description: "Change the command prefix",
    usage: ".prefix <newPrefix> [-g]",
    role: 0,
    category: "utility"
  },
  onRun: async ({ event, args, message, threadID, dataCache, saveTable }) => {
    if (!args[0]) {
      return message.reply("Please provide a new prefix.");
    }

    const newPrefix = args[0];
    const isGlobal = args.includes("-g");
    let updated = false;

    if (isGlobal) {
      const sender = event.key.participant || event.key.remoteJid;
      if (
        !global.client.config.admins.includes(sender.split("@")[0])
      ) {
        return message.reply("Only bot admins can change the global prefix.");
      }
      global.client.config.PREFIX = newPrefix;
      updated = true;

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const configPath = path.join(__dirname, "../../config.json");
      try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        config.PREFIX = newPrefix;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      } catch (e) {
        return message.reply("Failed to update config.json.");
      }
    }

    let prefixEntry = dataCache.prefixesData.find(p => p.id === threadID);
    if (prefixEntry) {
      prefixEntry.prefix = newPrefix;
    } else {
      dataCache.prefixesData.push({ id: threadID, prefix: newPrefix });
    }
    await saveTable("prefixesData", dataCache.prefixesData);

    let replyMsg = `Prefix for this thread has been set to: ${newPrefix}`;
    if (isGlobal && updated) {
      replyMsg += `\nGlobal prefix updated to: ${newPrefix}`;
    }
    await message.reply(replyMsg);
  },
};