import fs from "fs-extra";

export default {
  config: {
    name: "settings",
    role: 1
  },
  onRun: async ({ message, args }) => {
    if (!args[0]) return message.reply("invalid argument given");
    const config = global.client.config;
    const cmd = args[0].toLowerCase();
    const action = args[1]?.toLowerCase();

    try {
      switch (cmd) {
        case "list":
        case "-l":
          const text = `PRIVATE: ${config.private}\nAUTOLOAD: ${config.autoload}`;
          return message.reply(text);
        case "private":
          if (action) config.private = action;
          break;
        case "autoload":
          if (action) config.autoload = action;
          break;
        default:
          message.reply("argument not defined yet");
      }
    } catch (error) {
      message.reply("an error occurred: " + error.message);
    }
    fs.writeFileSync(new URL("./../../config.json", import.meta.url), JSON.stringify(config, null, 2), "utf8", (err) => {
      if (err) {
        message.reply("failed to update config file: " + err.message);
      } else {
        message.reply("successfully updated config file new settings will be loaded shortly");
      }
    });
  }
};