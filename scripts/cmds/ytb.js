import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url))

export default {
    config: {
        name: "ytb",
        cooldown: 30,
        aliese: ["youtube", "y", "yt"],
        description: "download YouTube videos",
        category: "media"
    },

    async onRun({ sock, event, args }) {
        const chatId = event.key.remoteJid;

        if (args.length === 0) {
            return await sock.sendMessage(
                chatId,
                {
                    text: "Please provide a search query.\nUsage: !ytb audio <query> or !ytb video <query>"
                },
                { quoted: event }
            );
        }

        let type = null;
        if (
            args[0].toLowerCase() === "audio" ||
            args[0].toLowerCase() === "-a"
        ) {
            type = "audio";
            args.shift();
        } else if (
            args[0].toLowerCase() === "video" ||
            args[0].toLowerCase() === "-v"
        ) {
            type = "video";
            args.shift();
        } else {
            return await sock.sendMessage(
                chatId,
                {
                    text: "Please specify type audio (-a) or video (-v).\nUsage: !ytb audio <query> or !ytb video <query>"
                },
                { quoted: event }
            );
        }

        const query = args.join(" ").trim();
        if (!query) {
            return await sock.sendMessage(
                chatId,
                { text: "Please provide a search query after the type." },
                { quoted: event }
            );
        }

        try {
            const apiUrl = `https://noobs-api.top/dipto/ytFullSearch?songName=${encodeURIComponent(
                query
            )}`;
            const response = await axios.get(apiUrl);
            const results = response.data;

            if (!Array.isArray(results) || results.length === 0) {
                return await sock.sendMessage(
                    chatId,
                    { text: `No results found for "${query}".` },
                    { quoted: event }
                );
            }

            const videos = results.slice(0, 5);

            let listevent = `🎵 *YouTube ${
                type === "audio" ? "Audio" : "Video"
            } Search Results for:* ${query}\n\n`;
            videos.forEach((video, i) => {
                listevent += `*${i + 1}.* ${video.title}\n`;
                listevent += `   ⏱️ ${video.time} | 📺 ${video.channel.name}\n`;
            });
            listevent +=
                "_Reply with the number (1-5) to select and download._";

            const sentevent = await sock.sendMessage(chatId, {
                text: listevent,
                quoted: event
            });
            global.client.replies.set(sentevent.key.id, {
                commandName: this.config.name,
                videos: videos,
                type: type
            });
        } catch (error) {
            console.error("Search error:", error);
            await sock.sendMessage(
                chatId,
                { text: "Failed to search YouTube. Please try again later." },
                { quoted: event }
            );
        }
    },
    onReply: async ({ sock, event, args, data, threadID, senderID }) => {
        const { videos, type } = data;
        try {
            await downloadAndSendMedia(videos, threadID, event, type,sock,args);
        } catch (err) {
            console.log(err);
            message.reply(
                "an error occurred please try again if the error still persist more than 5 times, contact the admin so tht it is resolved"
            );
        }
    }
};

const downloadAndSendMedia = async (videos, chatId, event, type,sock, body) => {
    try {
        const choice = parseInt(body.trim());
        if (isNaN(choice) || choice < 1 || choice > videos.length) {
            return await sock.sendMessage(
                chatId,
                {
                    text: "❌ Invalid selection. Please reply with a number between 1 and 5."
                },
                { quoted: event }
            );
        }

        const selectedVideo = videos[choice - 1];
        console.log(selectedVideo)

        await sock.sendMessage(
            chatId,
            { text: `Fetching your ${type} from:\n${selectedVideo.title}` },
            { quoted: event }
        );

        const format = type === "audio" ? "mp3" : "mp4";
        const dlApiUrl = `https://kaiz-apis.gleeze.com/api/yt-down?url=${selectedVideo.url}&apikey=${global.client.config.keys.kaiz}`;

        const dlRes = await axios.get(dlApiUrl);
        const dlData = dlRes.data.response["360p"];
        console.log(dlData)
        if (!dlData.download_url) {
            return await sock.sendMessage(
                chatId,
                { text: "Download info not found." },
                { quoted: event }
            );
        }

        const downloadUrl = dlData.download_url;
        const tmpFileName = `${selectedVideo.title
            .replace(/[<>:"\/\\|?*\x00-\x1F]/g, "")
            .slice(0, 40)}.${format}`;
        const tmpFilePath = path.join(__dirname, "cache", tmpFileName);

        const writer = fs.createWriteStream(tmpFilePath);

        const responseStream = await axios({
            url: downloadUrl,
            method: "GET",
            responseType: "stream"
        });

        responseStream.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        if (type === "audio") {
            await sock.sendMessage(
                chatId,
                {
                    audio: { url: tmpFilePath },
                    mimetype: "audio/mpeg",
                    fileName: tmpFileName,
                    ptt: false,
                    caption: selectedVideo.title
                },
                { quoted: event }
            );
        } else {
            await sock.sendMessage(
                chatId,
                {
                    video: { url: tmpFilePath },
                    mimetype: "video/mp4",
                    fileName: tmpFileName,
                    caption: selectedVideo.title
                },
                { quoted: event }
            );
        }

        fs.unlink(tmpFilePath, err => {
            if (err) console.error("Failed to delete temp file:", err);
        });
    } catch (err) {
        console.log(err);
        await sock.sendMessage(
            chatId,
            {
                text: "Failed to download/send the file. Please try again later."
            },
            { quoted: event }
        );
    }
};
