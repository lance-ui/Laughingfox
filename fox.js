process.on("unhandledRejection", error =>
    console.error("Unhandled Rejection:", error)
);
process.on("uncaughtException", error =>
    console.error("Uncaught Exception:", error)
);

import dotenv from "dotenv";
dotenv.config();
import P from "pino";
import {
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    Browsers,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    delay
} from "@whiskeysockets/baileys";
import pkg from "@whiskeysockets/baileys";
import utils from "./utils/utils.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import log from "./utils/log.js";
import messageHandler from "./handler/messagehandler.js";
import fs from "fs-extra";
import express from "express";
import qr from "qr-image";
import { File } from "megajs";
import db, { initSQLite } from "./utils/data.js";
import cron from "node-cron";
import moment from "moment-timezone";

const tz = "Africa/Lusaka";

function tasks() {
    log.info(
        `Hourly task executed at ${moment()
            .tz(tz)
            .format("YYYY-MM-DD HH:mm:ss")}`
    );
    process.exit(2);
}

cron.schedule(
    "0 * * * *",
    () => {
        tasks();
    },
    {
        timezone: tz
    }
);

const __dirname = dirname(fileURLToPath(import.meta.url));

const loadConfig = async () => {
    try {
        log.info("Loading configurations...");
        const data = await fs.readFile(
            new URL("./config.json", import.meta.url),
            "utf-8"
        );
        if (!data) throw new Error("Config data not found");
        log.success("Configurations loaded successfully");
        return JSON.parse(data);
    } catch (error) {
        log.error("Error loading configuration:", error.message);
        throw error;
    }
};

async function loadSessionFromMega() {
    if (true) {
        if (!global.client.config.SESSION_ID) {
            throw new Error("Please add your session to SESSION_ID in config!");
        }

        const sessdata = global.client.config.SESSION_ID.replace(
            "sypher™--",
            ""
        );
        const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);

        return new Promise((resolve, reject) => {
            filer.download((err, data) => {
                if (err) reject(err);
                fs.writeFile(
                    __dirname + "/cache/auth_info_baileys/creds.json",
                    data,
                    err => {
                        if (err) {
                            log.error("failed to load creds from mega");
                            process.exit(2);
                        }
                        log.success("Session downloaded from Mega.nz ✅");
                        resolve();
                    }
                );
            });
        });
    }
    return Promise.resolve();
}

global.client = {
    config: await loadConfig(),
    commands: new Map(),
    events: new Map(),
    replies: new Map(),
    cooldowns: new Map(),
    startTime: Date.now(),
    aliases: new Map()
};

await initSQLite();
global.utils = utils;
const { default: lance, proto } = pkg;
const { saveCreds, font } = utils;
async function main() {
    await loadSessionFromMega();
    log.info("Starting bot...");
    const sessionDir = path.join(__dirname, "cache", "auth_info_baileys");
    await fs.ensureDir(sessionDir);
    const { state } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = lance({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(
                state.keys,
                P({ level: "fatal" }).child({ level: "fatal" })
            )
        },
        printQRInTerminal: false,
        browser: Browsers.macOS("Safari"),
        markOnlineOnConnect: true,
        defaultQueryTimeoutMs: 60000,
        connectTimeoutMs: 60000,
        retryRequestDelayMs: 5000,
        maxRetries: 5,
        logger: P({ level: "silent" })
    });

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", async update => {
        const { connection, lastDisconnect } = update;
        if (
            connection === "close" &&
            lastDisconnect?.error?.output?.statusCode ===
                DisconnectReason.restartRequired
        ) {
            setTimeout(main, 10000);
        }
        if (connection === "open") {
            log.success("Connected to WhatsApp");
        }
    });

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
app.get("/", (req, res) => {
    res.json({ status: "bot is up and running" });
});
app.listen(global.client.config.PORT, () =>
    log.info("Bot running on port specified in config.json")
);

initialize();
