import dotenv from "dotenv";
dotenv.config();
import log from "./log.js";
import path, { dirname } from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import font from "./fonts.js";
import schedule from 'node-schedule';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function loadCommands() {
    const errs = {};
    const commandsPath = path.join(__dirname, "..", "scripts", "cmds");

    try {
        log.info("loading commands");
        const commandFiles =
            fs.readdirSync(commandsPath).filter(file => file.endsWith(".js")) ||
            file.endsWith(".ts");

        for (const file of commandFiles) {
            try {
                const commandModule = await import(
                    path.join(commandsPath, file)
                );
                const command = commandModule.default;
                if (!command) {
                    throw new Error(`Error: ${file} does not export anything!`);
                } else if (!command.config) {
                    throw new Error(`Error: ${file} does not export config!`);
                } else {
                    if (
                        command.config.name.includes(
                            global.client.config.unloadedCmds
                        )
                    ) {
                        continue;
                    }
                    global.client.commands.set(command.config.name, command);
                    if (command.config?.aliase) {
                        global.client.commands.set(
                            command.config.aliase.forEach(k => {
                              return k
                            }),
                            command
                        );
                    } else if (command.config.cooldown) {
                        global.client.cooldowns.set(
                            command.config.cooldown,
                            []
                        );
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
async function loadEvents() {
    log.info("loading events");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const eventsPath = path.join(__dirname, "..", "scripts", "events");
    const eventFiles = fs
        .readdirSync(eventsPath)
        .filter(file => file.endsWith(".js"));

    for (const file of eventFiles) {
        try {
            const eventModule = await import(path.join(eventsPath, file));
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

const loadAll = async () => {
    await loadCommands();
    await loadEvents();
};
setTimeout(loadAll, 5000);

async function saveCreds(creds) {
    try {
        const sessionDir = path.join(
            __dirname,
            "..",
            "cache",
            "auth_info_baileys"
        );
        await fs.writeFile(
            path.join(sessionDir, "creds.json"),
            JSON.stringify(creds)
        );
        log.info("Authentication credentials saved successfully");
    } catch (error) {
        log.error("Error saving authentication credentials:", error);
    }
}

async function removeFiles(filePath, time, callback) {
  if(!filePath) return 
  const fileName = path.basename(filePath);
  const rule = new schedule.RecurrenceRule();
  if (time.includes('h')) {
    const hours = parseInt(time.replace('h', ''));
    rule.hour = new schedule.Range(0, 23, hours);
  } else if (time.includes('m')) {
    const minutes = parseInt(time.replace('m', ''));
    rule.minute = new schedule.Range(0, 59, minutes);
  }

  schedule.scheduleJob(rule, async () => {
    try {
      if (await fs.pathExists(filePath)) {
        await fs.unlink(filePath);
        log.info(`Removed file: ${filePath}`);
        if (callback) callback(null, `File removed: ${filePath}`);
      } else {
        log.info(`File not found: ${filePath}`);
        if (callback) callback(new Error(`File not found: ${filePath}`));
      }
    } catch (error) {
      log.error(`Error removing file: ${error.message}`);
      if (callback) callback(error);
    }
  });

  log.info(`Job started. Removing ${fileName} ${time}.`);
}


const utils = {
    loadAll,
    loadCommands,
    loadEvents,
    font,
    saveCreds,
    removeFiles
};
export default utils;
