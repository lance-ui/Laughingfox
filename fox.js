process.on("unhandledRejection", (error) => console.log(error));
process.on("uncaughtException", (error) => console.log(error));

import dotenv from "dotenv";
dotenv.config();
import P from 'pino';
import pkg,{
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion, 
  Browsers,
  DisconnectReason
} from "@whiskeysockets/baileys";
import utils from "./utils/utils.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import log from "./utils/log.js";
import messageHandler from "./handler/messagehandler.js";
import fs from "fs-extra";
import express from "express";

const __dirname = dirname(fileURLToPath(import.meta.url));
const loadConfig = async () => {
    try{
        log.info("loading configurations")
        const data = await fs.readFile(new URL('./config.json',import.meta.url), 'utf-8');
        if(data){
            log.success("configurations loaded successfully")
            return JSON.parse(data)
        }else{
            throw new Error("config data not found")
        }
    }catch(e){
        throw new Error(e.message)
    }
}

const { proto } = pkg;
global.client = {
  config: await loadConfig(),
  commands: new Map(),
  events: new Map(),
  buttons: new Map(),
  cooldowns: new Map(),
  startTime: Date.now(),
};

global.utils = utils;

const { processSessionData, saveCreds, font } = utils;

async function main() {
  log.info("starting bot");
  const sessionData = await processSessionData();
  if (!sessionData) {
    throw new Error("session data not found");
  }
  const sessionDir = path.join(__dirname, "cache", "auth_info_baileys");
  const { state } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.appropriate("chrome"),
    markOnlineOnConnect: true,
    defaultQueryTimeoutMs: 60000,
    connectTimeoutMs: 60000,
    retryRequestDelayMs: 5000,
    maxRetries: 5,
    logger: P({ level: 'silent' })
  }); 
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      log.error(`Connection closed reconnecting: ${shouldReconnect}`);
      if (shouldReconnect) {
        main();
      }
    } else if (connection === "open") {
      log.success("Connected to whatsapp");
    }
  });

  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type === "notify") {
      console.log(messages);
      for (const event of messages) {
        await messageHandler({ font, event, sock,log,proto });
      }
    }
  });
    return sock;
}
/**
*handle autoload here
*/
async function watchFiles(){
    try{
        if(global.client.config.autoload){
          
        fs.watch("./config.json", async () => {
        log.info("detected change to config file reloading configurations")
        global.client.config= {}
        global.client.config = await loadConfig()
        })
        }
        const commandPath = path.join(__dirname, "scripts", "cmds")
        const eventPath = path.join(__dirname, "scripts", "events")
      
        fs.watch(commandPath,async () => {
            global.client.commands.clear()
            log.info("detected change in command path reloading commands")
            await global.utils.loadCommands()
        });
      
        fs.watch(eventPath, async () => {
            global.client.events.clear()
            log.info("detected change to event path reloading events")
            await global.utils.loadEvents()
        });
      
    }catch(error){
        throw new Error(error.message)
    }
}

async function initialize() {
  try {
    await main();
    await watchFiles()
  } catch (error) {
    log.error(error);
  }
}

const  app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', (_, res) => res.send(`bot is running!`));
app.listen(8080,"0.0.0.0",()=> log.info(`bot running on port 8080`))
initialize();
