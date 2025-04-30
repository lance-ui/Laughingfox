process.on("unhandledRejection", (error) => console.log(error));
process.on("uncaughtException", (error) => console.log(error));

import dotenv from "dotenv";
dotenv.config();
import pkg, {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion, 
  Browsers
} from "@whiskeysockets/baileys";
import utils from "./utils/utils.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import log from "./utils/log.js";
import NodeCache from "node-cache"
import messageHandler from "./handler/messagehandler.js";
import fs from "fs-extra";

const { 
    syncFullHistory, 
    markOnlineOnConnect,
    cachedGroupMetadata, 
    getMessageFromStore 
} = pkg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });
const loadConfig = async () => {
    try{
        log.info("loading configurations")
        const data = await fs.readFileSync(new URL('./config.json',import.meta.url));
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

const { processSessionData, font, savecreds } = utils;

async function main() {
  log.info("starting bot");
  const sessionData = await processSessionData();
  if (!sessionData) {
    throw new Error("session data not found");
  }
  const sessionDir = path.join(__dirname, "cache", "auth_info_baileys");
  const { state } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();
  const sock = await makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.macOS("desktop"),
    syncFullHistory: true,
    markOnlineOnConnect: false, //set this to true if you want notifications
    cachedGroupMetadata: async (jid) => groupCache.get(jid),
    getMessage: async (key) => await getMessageFromStore(key),
    defaultQueryTimeoutMs: 60000,
    connectTimeoutMs: 60000,
    retryRequestDelayMs: 5000,
    maxRetries: 5,
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
        await messageHandler({ font, event, sock });
      }
    }
  });
}

async function initialize() {
  try {
    await processSessionData()
    await main();
    setTimeOut(await global.utils.loadAll, 10000)
  } catch (error) {
    log.error(error);
  }
}

initialize();
