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

global.client = {
    config: await loadConfig(),
    commands: new Map(),
    events: new Map(),
    buttons: new Map(),
    cooldowns: new Map(),
    startTime: Date.now()
};

global.utils = utils;
const { default: lance, proto } = pkg;
const { saveCreds, font } = utils;

let qrCode;
async function main() {
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
        printQRInTerminal: global.client.config.useQr,
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
        const { connection, lastDisconnect, qr } = update;
        if (global.client.config.useQr) {
            qrCode = qr;
        } else {
            qrCode = "disabled";
        }
        if (connection === "connecting" && !global.client.config.useQr) {
            const phoneNumber = global.client.config?.number;
            if (!phoneNumber) {
                log.error("Phone number not found in config");
                return;
            }
            try {
                await delay(1600);
                const code = await sock.requestPairingCode(phoneNumber);
                console.log("please enter the following code in your WhatsApp");
                console.log(code);
            } catch (error) {
                log.error("Error requesting pairing code: \n" + error.message);
            }
        }
        if (
            connection === "close" &&
            lastDisconnect?.error?.output?.statusCode ===
                DisconnectReason.restartRequired
        ) {
            setTimeout(main, 10000);
        }
        if (connection === "open") {
            qrCode = "already_authorized";
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
app.use(express.static(path.join(__dirname, "utils", "public")));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "utils", "public", "index.html"));
});
setTimeout(() => {
    if (qrCode == null) qrCode = "timeout";
}, 30000);
app.get("/data", (req, res) => {
    if (qrCode == null) return;
    res.json({ data: qrCode });
});
app.get("/qr", (req, res) => {
    if (qrCode == null) return;
    if (qrCode == "already_authorized") {
        res.status(200).json({ data: "already_authorized" });
    }
    const timeStamp = setTimeout(Date.now, 1000);
    const filename = `img_${timeStamp}.jpg`;
    const filePath = path.join(
        dirname(fileURLToPath(import.meta.url)),
        "utils",
        "public",
        timeStamp,
        filename
    );
    fs.ensureDirSync(path.dirname(filePath));

    const qr_svg = qr.image(qrCode, { type: "jpg", size: 10 });
    qr_svg.pipe(fs.createWriteStream(filePath));

    qr_svg.on("end", () => {
        log.info(`QR code saved to ${filename}`);
        res.status(200).json({ qr: `${timeStamp}/${filename}` });
    });

    qr_svg.on("error", err => {
        log.error(err);
        res.status(500).json({ error: err.message });
    });
});
app.listen(global.client.config.PORT, () =>
    log.info("Bot running on port specified in config.json")
);

initialize();
