process.on("unhandledRejection", (error) => console.log(error));
process.on("uncaughtException", (error) => console.log(error));

import dotenv from "dotenv";
dotenv.config();
import P from 'pino';
import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion, 
  Browsers,
  DisconnectReason
} from "@whiskeysockets/baileys";
import pkg from '@whiskeysockets/baileys'
import utils from "./utils/utils.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import log from "./utils/log.js";
import messageHandler from "./handler/messagehandler.js";
import fs from "fs-extra";
import express from "express";

const { markOnlineOnConnect } = pkg;
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

global.client = {
  config: await loadConfig(),
  commands: new Map(),
  events: new Map(),
  buttons: new Map(),
  cooldowns: new Map(),
  startTime: Date.now()  
};

global.utils = utils;

const { processSessionData, savecreds, font } = utils;

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
    markOnlineOnConnect: false,
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
      log.info("Connection closed reconnecting:", shouldReconnect);
      if (shouldReconnect) {
        main();
      }
    } else if (connection === "open") {
      log.success("Connected to whatsapp");
    }
  });

  sock.ev.on("creds.update", savecreds);
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type === "notify") {
      console.log(messages);
      for (const event of messages) {
        await messageHandler({ font, event, sock,log });
      }
    }
  });
    return sock;
}

async function initialize() {
  try {
    await main();
  } catch (error) {
    log.error(error);
  }
}
const  app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', (_, res) => res.send(`${config.botName} is running!`));
app.listen(8080,"0.0.0.0",()=> log.info(`bot running on port 8080`))
initialize();
