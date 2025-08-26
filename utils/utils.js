import dotenv from "dotenv";
dotenv.config();
import log from "./log.js";
import path, { dirname } from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import font from "./fonts.js";
import axios from "axios";
import FormData from "form-data";

const __dirname = dirname(fileURLToPath(import.meta.url));

class Utils {
  async loadCommands() {
    const errs = {};
    const commandsPath = path.join(__dirname, "..", "scripts", "cmds");
    try {
      log.info("loading commands");
      const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
      for (const file of commandFiles) {
        try {
          const filePath = path.join(commandsPath, file);
          const commandModule = await import(filePath);
          const command = commandModule.default;
          if (!command) {
            throw new Error(`Error: ${file} does not export anything!`);
          } else if (!command.config) {
            throw new Error(`Error: ${file} does not export config!`);
          } else {
            if (command.config.name.includes(global.client.config.unloadedCmds)) {
              continue;
            }
            global.client.commands.set(command.config.name, command);
            if (command.config.aliase) {
              for (const alias of command.config.aliase) {
                global.client.aliases.set(alias, command);
              }
            } else if (command.config.cooldown) {
              global.client.cooldowns.set(command.config.cooldown, []);
            }
            log.success(`${command.config.name} successfully loaded`);
          }
        } catch (error) {
          log.error(`Error loading command ${file}: ${error.message}`);
        }
      }
    } catch (error) {
      log.error(error.message);
    }
    return Object.keys(errs).length === 0 ? false : errs;
  }

  async loadEvents() {
    log.info("loading events");
    const eventsPath = path.join(__dirname, "..", "scripts", "events");
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));
    for (const file of eventFiles) {
      try {
        const filePath = path.join(eventsPath, file);
        const eventModule = await import(filePath);
        const event = eventModule.default;
        if (!event) {
          throw new Error(`Error: ${file} does not export anything!`);
        } else if (!event.config) {
          throw new Error(`Error: ${file} does not export config`);
        } else if (!event.onEvent) {
          throw new Error(`Error: ${file} does not export onEvent!`);
        } else {
          global.client.events.set(event.config.name, event);
          log.success(`${event.config.name} successfully loaded`);
        }
      } catch (error) {
        log.error(`Error loading event ${file}: ${error.message}`);
      }
    }
  }

  async loadAll() {
    await this.loadCommands();
    await this.loadEvents();
  }

  async saveCreds(creds) {
    try {
      const sessionDir = path.join(__dirname, "..", "cache", "auth_info_baileys");
      await fs.writeFile(path.join(sessionDir, "creds.json"), JSON.stringify(creds));
      log.info("Authentication credentials saved successfully");
    } catch (error) {
      log.error("Error saving authentication credentials:", error);
    }
  }

  async uploadToImgbb(filePath) {
    try {
      const formData = new FormData();
      formData.append('image', fs.createReadStream(filePath));
      const response = await axios.post(`https//api.imgbb.com/1/upload?key=${global.client.config.keys.IMGBB}`, formData, {
        headers: {
          ...formData.getHeaders()
        }
      });
      return response.data.data;
    } catch (error) {
      log.error(`Error uploading file to imgbb: ${error.message}`);
    }
  }

  get font() {
    return font;
  }
}

const utils = new Utils();
setTimeout(utils.loadAll.bind(utils),5000)
export default utils;