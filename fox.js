import dotenv from "dotenv";
import P from "pino";
import { useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, DisconnectReason, makeCacheableSignalKeyStore } from "@whiskeysockets/baileys";
import pkg from "@whiskeysockets/baileys";
import utils from "./utils/utils.js";
import path, { dirname } from "path";
import log from "./utils/log.js";
import fs from "fs-extra";
import express from "express";
import messageHandler from "./handler/messagehandler.js";
import handleEvent from "./handler/handleEvent.js";
import db from "./utils/data.js";
import cron from "node-cron";
import moment from "moment-timezone";
import { File } from "megajs";
import { fileURLToPath } from "url";

dotenv.config();
const __dirname = dirname(fileURLToPath(import.meta.url));

class BaseBot {
  constructor() {
    this.config = {};
    this.commands = new Map();
    this.reactions = new Map();
    this.events = new Map();
    this.replies = new Map();
    this.cooldowns = new Map();
    this.startTime = Date.now();
    this.aliases = new Map();
  }

  async loadConfig() {
    try {
      const data = await fs.readFile(new URL("./config.json", import.meta.url), "utf-8");
      this.config = JSON.parse(data);
    } catch (error) {
      log.error("Error loading configuration:", error.message);
      throw error;
    }
  }
}

class WhatsAppBot extends BaseBot {
  constructor() {
    super();
    this.sock = null;
    this.sessionDir = path.join(process.cwd(), "cache", "auth_info_baileys");
  }

  async loadSessionFromMega() {
    if (true) {
      if (!this.config.SESSION_ID) {
        throw new Error("Please add your session to SESSION_ID in config!");
      }
      const sessdata = this.config.SESSION_ID.replace("sypher™--", "");
      const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);
      return new Promise((resolve, reject) => {
        filer.download((err, data) => {
          if (err) reject(err);
          fs.writeFile(__dirname + "/cache/auth_info_baileys/creds.json", data, err => {
            if (err) {
              log.error("failed to load creds from mega");
              process.exit(2);
            }
            log.success("Session downloaded from Mega.nz");
            resolve();
          });
        });
      });
    }
    return Promise.resolve();
  }

  async connect() {
    const { state } = await useMultiFileAuthState(this.sessionDir);
    const { version } = await fetchLatestBaileysVersion();
    const { default: lance } = pkg;
    this.sock = lance({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, P({ level: "fatal" }).child({ level: "fatal" })),
      },
      printQRInTerminal: false,
      browser: Browsers.macOS("Safari"),
      markOnlineOnConnect: true,
      defaultQueryTimeoutMs: 60000,
      connectTimeoutMs: 60000,
      retryRequestDelayMs: 5000,
      maxRetries: 5,
      logger: P({ level: "silent" }),
    });

    this.sock.ev.on("creds.update", utils.saveCreds);

    this.sock.ev.on("connection.update", async update => {
      const { connection, lastDisconnect } = update;
      if (connection === "close" && lastDisconnect?.error?.output?.statusCode === DisconnectReason.restartRequired) {
        setTimeout(() => this.connect(), 10000);
      }
      if (connection === "open") {
        log.success("Connected to WhatsApp");
      }
    });
  }

  async start() {
    await this.loadConfig();
    global.client = {
      config: this.config,
      commands: this.commands,
      reactions: this.reactions,
      events: this.events,
      replies: this.replies,
      cooldowns: this.cooldowns,
      startTime: this.startTime,
      aliases: this.aliases,
    };
    await this.loadSessionFromMega();
    await this.connect();
    await db.initSQLite();
    global.utils = utils;

    this.sock.ev.on("messages.upsert", async ({ messages, type }) => {
      console.log(messages)
      if (type === "notify") {
        for (const event of messages) {
          await messageHandler({ font: utils.font, event, sock: this.sock, log, proto: pkg.proto });
        }
      }
    });

    this.sock.ev.on("groups.update", async ({ event, update }) => {
      await handleEvent({ sock: this.sock, event, log, font: utils.font, update });
    });

    this.sock.ev.on("group-participants.update", async ({ event, update }) => {
      await handleEvent({ sock: this.sock, event, log, font: utils.font, update })
    });
  }
}

class BotServer {
  constructor(bot) {
    this.bot = bot;
    this.app = express();
  }

  async startServer() {
    this.app.get("/", (req, res) => {
      res.json({ status: "bot is up and running" });
    });

    this.app.listen(this.bot.config.PORT, () => log.info(`Bot running on port ${this.bot.config.PORT}`));
  }
}

async function main() {
  const bot = new WhatsAppBot();
  await bot.start();

  const server = new BotServer(bot);
  await server.startServer();

  const TIMEZONE = "Africa/Lusaka";
  
  cron.schedule("07 * * * *", () => {
    log.info(`Hourly task executed at ${moment().tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss")}`);
    process.exit(2);
  }, { timezone: TIMEZONE });
}

process.on("unhandledRejection", error => console.error("Unhandled Rejection:", error));
process.on("uncaughtException", error => console.error("Uncaught Exception:", error));

main();
