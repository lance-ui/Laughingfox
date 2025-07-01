import { spawn } from "child_process";
import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";
import yts from "yt-search";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const cacheFolder = path.resolve(__dirname, "./cache");

if (!fs.existsSync(cacheFolder)) {
    fs.mkdirSync(cacheFolder);
}

export default {
    config: {
        name: "song",
        cooldown: 10,
        aliese: ["youtube", "y", "yt"],
        description: "download YouTube videos",
        category: "media"
    },

    async onRun({ sock, event, args, threadID }) {
        if (args.length === 0) {
            return await sock.sendMessage(
                threadID,
                {
                    text: "Please provide a search query.\nUsage: !play <query>"
                },
                { quoted: event }
            );
        }
        const query = args.join(" ").trim();
        if (!query) {
            return await sock.sendMessage(
                threadID,
                { text: "Please provide a search query." },
                { quoted: event }
            );
        }

        try {
            const results = (await yts(args.join(" "))).videos;

            if (!Array.isArray(results) || results.length === 0) {
                return await sock.sendMessage(
                    threadID,
                    { text: `No results found for "${query}".` },
                    { quoted: event }
                );
            }
            await downloadAndSendMedia(results, threadID, event, sock);
        } catch (error) {
            console.error("Search error:", error);
            await sock.sendMessage(
                threadID,
                { text: "Failed to search YouTube. Please try again later." },
                { quoted: event }
            );
        }
    }
};

const downloadAndSendMedia = async (videos, threadID, event, sock) => {
    try {
        const format = "mp4";
        const selectedVideo = videos[0];

        await sock.sendMessage(
            threadID,
            { text: `Fetching your video from:\n${selectedVideo.title}` },
            { quoted: event }
        );
        const dlApiUrl = `https://kaiz-apis.gleeze.com/api/yt-down?url=${selectedVideo.url}&apikey=${global.client.config.keys.kaiz}`;

        const dlRes = await axios.get(dlApiUrl);
        const dlData = dlRes.data.response["360p"];

        if (!dlData || !dlData.download_url) {
            return await sock.sendMessage(
                threadID,
                { text: "Download info not found." },
                { quoted: event }
            );
        }

        const downloadUrl = dlData.download_url;
        const tmpFileName = `${selectedVideo.title
            .replace(/[<>:"\/\\|?*\x00-\x1F]/g, "")
            .slice(0, 40)}.${format}`;
        const tmpFilePath = path.join(__dirname, "cache/" + tmpFileName);

        const writer = fs.createWriteStream(tmpFilePath);

        const responseStream = await axios({
            url: downloadUrl,
            method: "GET",
            responseType: "stream",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
            }
        });

        responseStream.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });
        const audioPath = await convertMp4ToMp3(tmpFilePath)
        await sock.sendMessage(
            threadID,
            {
                video: { url: audioPath },
                mimetype: "audio/mpeg",
                fileName: tmpFileName,
                caption: selectedVideo.title
            },
            { quoted: event }
        );

        fs.unlink(tmpFilePath, err => {
            if (err) console.error("Failed to delete temp file:", err);
        });
    } catch (err) {
        console.log(err);
        await sock.sendMessage(
            threadID,
            {
                text: "Failed to download/send the file. Please try again later."
            },
            { quoted: event }
        );
    }
};
const convertMp4ToMp3 = async filePath => {
    try {
        const outputFilePath = path.join(
            path.dirname(filePath),
            `${path.basename(filePath, ".mp4")}.mp3`
        );

        await new Promise((resolve, reject) => {
            const ffmpegProcess = spawn("ffmpeg", [
                "-i",
                filePath,
                "-vn",
                "-ar",
                "44100",
                "-ac",
                "2",
                "-ab",
                "192k",
                outputFilePath
            ]);

            ffmpegProcess.stdout.on("data", data => {
                console.log(`stdout: ${data}`);
            });

            ffmpegProcess.stderr.on("data", data => {
                console.error(`stderr: ${data}`);
            });

            ffmpegProcess.on("close", code => {
                if (code === 0) {
                    resolve(outputFilePath);
                } else {
                    reject(new Error(`FFmpeg exited with code ${code}`));
                }
            });
        });

        return outputFilePath;
    } catch (err) {
        console.error("Conversion error:", err);
        throw err;
    }
};
