import fs from "fs-extra";

export default {
  config: {
    name: "config",
    role: 1
  },
  onRun: async ({ message, args }) => {
    if (!args[0]) return message.reply("invalid argument given");

    const config = global.client.config;
    const cmd = args[0].toLowerCase();
    const key = args[1]?.toLowerCase();
    const value = args[2];
    const value2 = args[3];

    try {
      switch (cmd) {
        case "get":
          if (key) {
            return message.reply(`${key}: ${config[key]}`);
          } else {
            message.reply("please specify a key");
          }
          break;
        case "set":
          if (key && value) {
            if (value === "1" || value.toLowerCase() === "true") {
              config[key] = true;
            } else if (value === "0" || value.toLowerCase() === "false") {
              config[key] = false;
            } else {
              if (value2 == "-u"){
                config[key.toUpperCase()] = value;
              } else {
                config[key] = value;
              }
            }
            fs.writeFileSync(
              new URL("./../../config.json", import.meta.url),
              JSON.stringify(config, null, 2),
              "utf8"
            );
            message.reply("successfully updated config file");
          } else {
            message.reply("please specify a key and value");
          }
          break;
        default:
          message.reply("argument not defined yet");
      }
    } catch (error) {
      message.reply("an error occurred: " + error.message);
    }
  }
};