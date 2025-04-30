process.on("unhandledRejection", (error) => console.log(error));
process.on("uncaughtException", (error) => console.log(error));

import dotenv from "dotenv";
dotenv.config();
import pkg, {
  makeWASocket,
  Browser,
  syncFullHistory,
  markOnlineOnConnect,
  useMultiFileAuthState,
  cachedGroupMetadata,
} from "baileys";
import utils from "./utils/utils.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import log from "./utils/log.js";
import messageHandler from "./handler/messagehandler.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });
const { getMessageFromStore } = pkg;
const config = import("./config.json", { assert: { type: "json" } });

global.client = {
  config: config,
  commands: new Map(),
  events: new Map(),
  buttons: new Map(),
  cooldowns: new Map(),
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
    browser: Browser.macOS("Desktop"),
    syncFullHistory: true,
    markOnlineOnConnect: false, //set this to true if you want notifications
    cachedGroupMetadata: async (jid) => groupCache.get(jid),
    getMessage: async (key) => await getMessageFromStore(key),
    defaultQueryTimeoutMs: 60000,
    connectTimeoutMs: 60000,
    retryRequestDelayMs: 5000,
    maxRetries: 5,
  });
  if (!sok.authState.creds.registered) {
    log.info(
      "laughing fox not logged in trying to log in using available number"
    );
    if (!global.client.config.number) {
      log.error("phone number not found in config.json");
    } else if (global.client.config.number.startsWith("+")) {
      log.error("the phone number should not start with + or -");
    }
    const number = global.config.number;
    const code = await sock.requestPairingCode(number);
    if (!code) {
      log.error(
        "failed to request for a pairing code.Make sure the number is registered on whatsapp"
      );
    } else {
      log.info(
        `please verify the login by entering the following code in whatsapp\n${code}`
      );
    }
  }
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      log.info("Connection closed, reconnecting:", shouldReconnect);
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
    await main();
  } catch (error) {
    log.error(error);
  }
}

initialize();
