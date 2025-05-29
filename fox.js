process.on("unhandledRejection", error => console.error("Unhandled Rejection:", error));
process.on("uncaughtException", error => console.error("Uncaught Exception:", error));

import dotenv from "dotenv";
dotenv.config();
import P from "pino";
import pkg, {
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
    try {
        log.info("Loading configurations...");
        const data = await fs.readFile(new URL("./config.json", import.meta.url), "utf-8");
        if (!data) throw new Error("Config data not found");
        log.success("Configurations loaded successfully");
        return JSON.parse(data);
    } catch (error) {
        log.error("Error loading configuration:", error.message);
        throw error;
    }
};

global.client = {
    config: await loadConfig(),
    commands: new Map(),
    events: new Map(),
    buttons: new Map(),
    cooldowns: new Map(),
    startTime: Date.now()
};

global.utils = utils;

const { saveCreds, font } = utils;

async function main() {
    log.info("Starting bot...");
    const sessionDir = path.join(__dirname, "cache", "auth_info_baileys");
    await fs.ensureDir(sessionDir);
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
        logger: P({ level: "silent" })
    });

    sock.ev.on("connection.update", async update => {
        const { connection, lastDisconnect, qr } = update;
        if(connection === "connecting" || !!qr){
          const phoneNumber = global.client.config || "";
          if(!phoneNumber){
            throw new Error("phone Number in config not found make sure to add it at number")
          }
          const code = await sock.requestPairingCode(phoneNumber)
          console.log(code)
        }else if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            log.error(`Connection closed. Reconnecting: ${shouldReconnect}`);
            if (shouldReconnect) {
                main();
            }
        } else if (connection === "open") {
            log.success("Connected to WhatsApp");
        }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type === "notify") {
            console.log(messages);
            for (const event of messages) {
                await messageHandler({ font, event, sock, log, proto });
            }
        }
    });

    return sock;
}

async function watchFiles() {
    try {
        if (global.client.config.autoload) {
            fs.watch("./config.json", async () => {
                log.info("Config file changed, reloading...");
                global.client.config = await loadConfig();
            });
        }

        const watchPaths = [
            {
                dir: path.join(__dirname, "scripts", "cmds"),
                handler: global.utils.loadCommands,
                collection: global.client.commands
            },
            {
                dir: path.join(__dirname, "scripts", "events"),
                handler: global.utils.loadEvents,
                collection: global.client.events
            }
        ];

        watchPaths.forEach(({ dir, handler, collection }) => {
            fs.watch(dir, async () => {
                log.info(`Change detected in ${dir}, reloading...`);
                collection.clear();
                await handler();
            });
        });
    } catch (error) {
        log.error("Error watching files:", error.message);
        throw error;
    }
}

async function initialize() {
    try {
        await main();
        await watchFiles();
    } catch (error) {
        log.error("Initialization error:", error);
    }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (_, res) => res.send("Bot is running!"));
app.listen(8080, "0.0.0.0", () => log.info("Bot running on port 8080"));

initialize();