import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";
import yts from "yt-search";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const cacheFolder = path.resolve(__dirname, './cache');

if (!fs.existsSync(cacheFolder)) {
  fs.mkdirSync(cacheFolder);
}

export default {
  config: {
    name: "play",
    cooldown: 10,
    aliese: ["youtube", "y", "yt"],
    description: "download YouTube videos",
    category: "media",
  },

  async onRun({ sock, event, args, threadID }) {
    if (args.length === 0) {
      return await sock.sendMessage(
        threadID,
        {
          text: "Please provide a search query.\nUsage: !play <query>",
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
  },
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
      responseType: "stream"
    });

    responseStream.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    await sock.sendMessage(
      threadID,
      {
        video: { url: tmpFilePath },
        mimetype: "video/mp4",
        fileName: tmpFileName,
        caption: selectedVideo.title,
      },
      { quoted: event }
    );

    fs.unlink(tmpFilePath, (err) => {
      if (err) console.error("Failed to delete temp file:", err);
    });
  } catch (err) {
    console.log(err);
    await sock.sendMessage(
      threadID,
      {
        text: "Failed to download/send the file. Please try again later.",
      },
      { quoted: event }
    );
  }
};
