import commandHander from "./commandHandler.js";
import handleOnReply from "./handleOnReply.js";
import handleOnReaction from "./handleOnReaction.js";
import handleOnChat from "./handleonChat.js";
import { setgroupBanned, setuserBanned, handleDatabase } from "./handleDatabase.js";
import path, { dirname } from "path";
import db, { dataCache, saveTable, getPrefixesData, getTable, getUserData, getgroupData, getUserMoney, isGroupBanned, isUserBanned } from "../utils/data.js";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

class MessageHandler {
  constructor({ font, sock, log, proto }) {
    this.font = font;
    this.sock = sock;
    this.log = log;
    this.proto = proto;
  }

  async getCurrentPrefix(threadID) {
    const customPrefix = await getPrefixesData(threadID);
    if (customPrefix && customPrefix.length > 0) {
      return customPrefix;
    }
    return global.client.config.PREFIX;
  }

  async mainFunc({ senderID, threadID, event, message, args, bot }) {
    try {
      if (((event.messageTimestamp % 60) - (Date.now() % 60)) > 20) {
        return;
      }

      const threadPrefix = await getPrefixesData(threadID);
      const currentPrefix = threadPrefix || global.client.config.PREFIX;
      const isPrefixed = args.startsWith(currentPrefix);

      if (!global.client.config.admins.includes(senderID.replace("@lid", "")) && global.client.config.private && isPrefixed) {
        return message.send(`❌ | currently only the bot admin can use the bot`);
      }

      if (args.toLowerCase() == "prefix") {
        const threadPrefix = await getPrefixesData(threadID);
        let form = '';
        form += `◣✦◥▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔◤✦◢\n`
        form += `                  BOT PREFIX•[${global.client.config.PREFIX}]\n`
        form += `                  GROUP PREFIX•[${threadPrefix || global.client.config.PREFIX}]\n`
        form += `◤✦◢▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁◣✦◥`;
        const datapath = path.join(__dirname, "..", "cache", "tmp", "0bcb6c5caa664b982dd49d18aca40941.jpg");
        return await message.sendImage(form, datapath);
      }

      if (!isPrefixed) return;

      const userBanned = await db.isUserBanned(senderID);
      if (userBanned && !global.client.config.admins.includes(senderID.replace("@lid", ""))) {
        return message.send("❌ | You are banned from using the bot.");
      }

      const groupBanned = await db.isGroupBanned(threadID);
      if (groupBanned && !global.client.config.admins.includes(senderID.replace("@lid", ""))) {
        return message.send("❌ | This group is banned");
      }

      const [commandName, ...commandArgs] = args
        .slice(currentPrefix.length)
        .trim()
        .split(" ");

      if (!global.client.commands.has(commandName.toLowerCase()) && !global.client.aliases.has(commandName.toLowerCase())) {
        await this.sock.sendMessage(threadID, { text: `❌ | the command '${commandName}' does not exist type ${global.client.config.PREFIX}help to view all the available commands` });
        return;
      }

      await commandHander({ sock: this.sock, event, threadID, senderID, args: commandArgs, log: this.log, commandName, font: this.font, message, bot, proto: this.proto, dataCache, saveTable, getPrefixesData, getTable, getUserData, getgroupData, getUserMoney, setgroupBanned, setuserBanned });
      return;
    } catch (error) {
      console.log(error);
      return;
    }
  }
  async helperFunc({ threadID, senderID, message, args, bot, event }) {
    try {
      await handleDatabase({ threadID, senderID, sock: this.sock });
      await handleOnReply({ sock: this.sock, event, threadID, senderID, proto: this.proto, font: this.font, bot, message, args, dataCache, saveTable, getPrefixesData, getTable, getUserData, getgroupData, getUserMoney, setuserBanned, setgroupBanned });
      await handleOnReaction({ sock: this.sock, event, threadID, senderID, proto: this.proto, font: this.font, bot, message, args, dataCache, saveTable, getPrefixesData, getTable, getUserData, getgroupData, getUserMoney, setuserBanned, setgroupBanned });
      await handleOnChat({ sock: this.sock, event, threadID, senderID, proto: this.proto, font: this.font, bot, message, args, dataCache, saveTable, getPrefixesData, getTable, getUserData, getgroupData, getUserMoney, setuserBanned, setgroupBanned });
    } catch (error) {
      console.log(error);
      return;
    }
  }

  async handleMessage(event) {
    let senderID;
    try {
      const threadID = event.key.remoteJid;
      if (threadID === "status@broadcast") return;
      senderID = event.key.participant;
      if (!senderID) {
        senderID = threadID.split("@")[0] + "@lid";
      }

      const message = {
        send: async form => {
          return await this.sock.sendMessage(threadID, { text: form });
        },
        reply: async form => {
          return await this.sock.sendMessage(threadID, { text: form }, { quoted: event });
        },
        edit: async (form, data) => {
          return await this.sock.sendMessage(threadID, { text: form, edit: data.key });
        },
        react: async (emoji, data) => {
          return await this.sock.sendMessage(threadID, { react: { text: emoji, key: data.key } });
        },
        unsend: async data => {
          await this.sock.sendMessage(threadID, { delete: data.key });
        },
        sendGif: async (filepath, cap) => {
          return await this.sock.sendMessage(threadID, { video: { url: filepath, caption: cap || "", gifPlayback: true } });
        },
        sendAudio: async (filepath, cap) => {
          return await this.sock.sendMessage(threadID, { audio: { url: filepath, caption: cap || "" } });
        },
        sendVideo: async (cap, filepath, boo) => {
          return await this.sock.sendMessage(threadID, { image: { url: filepath }, viewOnce: boo || false, caption: cap || "" });
        },
        sendImage: async (cap, filepath, boo) => {
          return await this.sock.sendMessage(threadID, { image: { url: filepath }, viewOnce: boo || false, caption: cap || "" });
        }
      };

      const bot = {
        changeProfileStatus: async form => {
          return await this.sock.updateProfileStatus(form);
        },
        changeProfileName: async form => {
          return await this.sock.updateProfileName(form);
        },
        changeProfilePic: async filepath => {
          return await this.sock.updateProfilePicture(threadID, { url: filepath });
        },
        removeProfilePic: async id => {
          return await this.sock.removeProfilePicture(id);
        },
        createGroup: async (sock, name, members) => {
          return this.sock.groupCreate(name, [members]);
        },
        participants: async (id, action) => {
          return await this.sock.groupParticipantsUpdate(threadID, [id], action);
        },
        leave: async id => {
          return await this.sock.groupLeave(id);
        },
        user: async (id, action) => {
          return await this.sock.updateBlockStatus(id, action);
        }
      };

      if (!event.message) return;
      let args = "";
      if (event.message.conversation) {
        args = event.message.conversation;
      } else if (event.message.extendedTextMessage) {
        args = event.message.extendedTextMessage.text;
      } else if (event.message.imageMessage) {
        args = event.message.imageMessage.caption || "";
      } else if (event.message.videoMessage) {
        args = event.message.videoMessage.caption || "";
      } else if (event.message.extendedTextMessage) {
        args = event.message.extendedTextMessage.text;
      }

      await this.mainFunc({ senderID, threadID, event, message, args, bot });
      await this.helperFunc({ threadID, senderID, message, args, bot, event });
    } catch (e) {
      console.log(e);
    }
  }
}

export default async ({ font, sock, event, log, proto }) => {
  const messageHandler = new MessageHandler({ font, sock, log, proto });
  await messageHandler.handleMessage(event);
};
  