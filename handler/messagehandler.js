import commandHander from "./commandhandler.js";
import handleOnReply from "./handleOnReply.js";

export default async ({ font, sock, event, log, proto }) => {
    try {
        const threadID = event.key.remoteJid;
        const senderID = event.key.participant;
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
        const isPrefixed = args.startsWith(global.client.config.PREFIX);
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
            const form = `◣✦◥▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔◤✦◢
               𝗕𝗢𝗧 𝗣𝗥𝗘𝗙𝗜𝗫•[${global.client.config.PREFIX}]
◤✦◢▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁◣✦◥`;
            const datapath = await path.join(
                __dirname,
                "..",
                "cache",
                "tmp",
                "0bcb6c5caa664b982dd49d18aca40941.jpg"
            );
            return await message.sendImage(form, datapath);
        }
        if (!isPrefixed) return;
        const [commandName, ...commandArgs] = args
            .slice(global.client.config.PREFIX.length)
            .trim()
            .split(" ");

        await handleOnReply({
            sock,
            event,
            threadID,
            senderID,
            args: commandArgs,
            proto
        });

        if (!global.client.commands.has(commandName.toLowerCase())) {
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
            proto
        });
    } catch (e) {
        console.log(e);
    }
};
