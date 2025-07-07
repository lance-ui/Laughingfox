import commandHander from "./commandHandler.js";
import handleOnReply from "./handleOnReply.js";
import path, { dirname } from "path";
import db, { dataCache, saveTable, getPrefixesData, getTable, getUserData, getgroupData, getUserMoney, isGroupBanned, isUserBanned } from "../utils/data.js";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url))

export default async ({ font, sock, event, log, proto }) => {
    let senderID;
    try {
        const threadID = event.key.remoteJid;
        if (threadID === "status@broadcast") return;
        senderID = event.key.participant;
        if (!senderID) {
            senderID = threadID.split("@")[0] + "@lid"
        }

        let updated = false;

        if (!dataCache.userMoney.find(user => user.id === senderID)) {
            dataCache.userMoney.push({
                id: senderID,
                money: 0,
                msgCount: 0
            });
            await saveTable('userMoney', dataCache.userMoney);
            updated = true;
        }
        if (!dataCache.userData.find(user => user.id === senderID)) {
            dataCache.userData.push({
                id: senderID,
                name: event.pushName || "Unknown"
            });
            await saveTable('userData', dataCache.userData);
            updated = true;
        }
        if (!dataCache.prefixesData.find(user => user.id === threadID)) {
            dataCache.prefixesData.push({
                id: threadID,
                prefix: global.client.config.PREFIX
            });
            await saveTable('prefixesData', dataCache.prefixesData);
            updated = true;
        }
        if (!dataCache.groupData.find(user => user.id === threadID && user.uid === senderID) && threadID.endsWith("@g.us")) {
            const groupMetadata = async () => {
                const groupInfo = await sock.groupMetadata(threadID);
                return groupInfo ? groupInfo.subject : "Unknown Group";
            }
            const groupName = await groupMetadata();
            dataCache.groupData.push({
                id: threadID,
                name: groupName,
                uid: senderID,
                banned: 0
            });
            await saveTable('groupData', dataCache.groupData);
            updated = true;
        }


        const message = {

            send: async form => {

                return await sock.sendMessage(threadID, { text: form });

            },

            reply: async form => {

                return await sock.sendMessage(

                    threadID,

                    { text: form },

                    { quoted: event }

                );

            },

            edit: async (form, data) => {

                return await sock.sendMessage(threadID, {

                    text: form,

                    edit: data.key

                });

            },

            react: async (emoji, data) => {

                return await sock.sendMessage(threadID, {

                    react: {

                        text: emoji,

                        key: data.key

                    }

                });

            },

            unsend: async data => {

                await sock.sendMessage(threadID, { delete: data.key });

            },

            sendGif: async (filepath, cap) => {

                return await sock.sendMessage(threadID, {

                    video: {

                        url: filepath,

                        caption: cap || "",

                        gifPlayback: true

                    }

                });

            },

            sendAudio: async (filepath, cap) => {

                return await sock.sendMessage(threadID, {

                    audio: {

                        url: filepath,

                        caption: cap || ""

                    }

                });

            },

            sendVideo: async (cap, filepath, boo) => {

                return await sock.sendMessage(threadID, {

                    image: {

                        url: filepath

                    },

                    viewOnce: boo || false,

                    caption: cap || ""

                });

            },

            sendImage: async (cap, filepath, boo) => {

                return await sock.sendMessage(threadID, {

                    image: {

                        url: filepath

                    },

                    viewOnce: boo || false,

                    caption: cap || ""

                });

            }

        };

        const bot = {

            changeProfileStatus: async form => {

                return await sock.updateProfileStatus(form);

            },

            changeProfileName: async form => {

                return await sock.updateProfileName(form);

            },

            changeProfilePic: async filepath => {

                return await sock.updateProfilePicture(threadID, {

                    url: filepath

                });

            },

            removeProfilePic: async id => {

                return await sock.removeProfilePicture(id);

            },

            createGroup: async (sock, name, members) => {

                return sock.groupCreate(name, [members]);

            },

            participants: async (id, action) => {

                return await sock.groupParticipantsUpdate(

                    threadID,

                    [id],

                    action

                );

            },

            leave: async id => {

                return await sock.groupLeave(id);

            },

            user: async (id, action) => {

                return await sock.updateBlockStatus(id, action);

            }

        };

        if (!event.message) return;

        let args = "";

        if (event.message.conversation) {

            args = event.message.conversation;

        } else if (event.extendedTextMessage) {

            args = event.extendedTextMessage.text;

        } else if (event.imageMessage) {

            args = event.imageMessage.caption || "";

        } else if (event.videoMessage) {

            args = event.videoMessage.caption || "";

        } else if (event.message.extendedTextMessage) {

            args = event.message.extendedTextMessage.text;

        }
        const setuserBanned = async (userId, banned) => {
            const userIndex = dataCache.userData.findIndex(user => user.id === userId);
            if (userIndex !== 1) {
                dataCache.userData[userIndex].banned = banned ? 1 : 0;
                await saveTable('userData', dataCache.userData);
            }
        }
        const setgroupBanned = async (groupId, banned) => {
            const groupIndex = dataCache.groupData.findIndex(group => group.id === groupId);
            if (groupIndex !== 1) {
                dataCache.groupData[groupIndex].banned = banned ? 1 : 0;
                await saveTable('groupData', dataCache.groupData);
            }
        }
        await handleOnReply({

            sock,

            event,

            threadID,

            senderID,

            proto,

            event,

            font,

            bot,

            message,

            args,

            dataCache,

            saveTable,

            getPrefixesData,

            getTable,

            getUserData,

            getgroupData,

            getUserMoney,

            setuserBanned,

            setgroupBanned

        });
        const threadPrefix = await getPrefixesData(threadID);
        const currentPrefix = threadPrefix || global.client.config.PREFIX;
        const isPrefixed = args.startsWith(currentPrefix);

        if (

            !global.client.config.admins.includes(

                senderID.replace("@lid", "")

            ) &&

            global.client.config.private &&

            isPrefixed

        ) {

            return message.send(

                `❌  | currently only the bot admin can use the bot`

            );

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
        let userMoney = dataCache.userMoney.find(user => user.id === senderID);
        if (userMoney) {
            userMoney.msgCount = (userMoney.msgCount || 0) + 1;
            await saveTable('userMoney', dataCache.userMoney);
        }
        let groupData = dataCache.groupData.find(user => user.id === threadID && user.uid === senderID);
        if (groupData) {
            groupData.msgCount = (groupData.msgCount || 0) + 1;
            dataCache.groupData.push(groupData);
            await saveTable('groupData', dataCache.groupData);
        }

        const userBanned = await db.isUserBanned(senderID);
        if (userBanned && isPrefixed && !global.client.config.admins.includes(senderID.replace("@lid", ""))) {
            return message.send("❌ | You are banned from using the bot.");
        }

        const groupBanned = await db.isGroupBanned(threadID);
        if (groupBanned && isPrefixed && !global.client.config.admins.includes(senderID.replace("@lid", ""))) {
            return message.send("❌ | This group is banned");
        }

        if (!isPrefixed) return;

        const [commandName, ...commandArgs] = args
            .slice(currentPrefix.length)
            .trim()
            .split(" ");

        if (!global.client.commands.has(commandName.toLowerCase()) && !global.client.aliases.has(commandName.toLowerCase())) {

            await sock.sendMessage(threadID, {

                text: `❌ |  the  command '${commandName}' does not exist type ${global.client.config.PREFIX}help to view all the available commands`

            });

            return;

        }

        await commandHander({

            sock,

            event,

            threadID,

            senderID,

            args: commandArgs,

            log,

            commandName,

            font,

            message,

            bot,

            proto,

            dataCache,

            saveTable,

            getPrefixesData,

            getTable,

            getUserData,

            getgroupData,

            getUserMoney,

            setgroupBanned,

            setuserBanned,

        });

    } catch (e) {

        console.log(e);

    }

};

async function getCurrentPrefix(threadID) {
    const customPrefix = await getPrefixesData(threadID);
    if (customPrefix && customPrefix.length > 0) {
        return customPrefix;
    }
    return global.client.config.PREFIX;
}