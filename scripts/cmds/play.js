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

const getData = async (url, type) => {
  try {
    const start = new Date();
    const response = await axios.post(
      "https://ytdownload.in/api/allinonedownload",
      {
        contentType: type,
        quality: null,
        url: url,
      },
      {
        headers: {
          Accept: "*/*",
          "Accept-Encoding": "gzip, deflate, br, zstd",
          "Accept-Language": "en-US,en;q=0.5",
          Connection: "keep-alive",
          "Content-Type": "application/json",
          Cookie:
            "_ga_YLV6Y36HY1=GS1.1.1746473863.1.1.1746473912.0.0.0; _ga=GA1.1.739180884.1746473864",
          Host: "ytdownload.in",
          Origin: "https://ytdownload.in",
          Priority: "u=0",
          Referer: "https://ytdownload.in/",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0",
        },
      }
    );
    if (response.data.responseFinal) {
      const end = new Date();
      const time = (end - start) / 1000;
      response.data["timetaken"] = time + " seconds";
    }
    console.log(response.data);
    return response.data.responseFinal;
  } catch (error) {
    console.error(error);
  }
};

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
    const format = "mp3";
    const selectedVideo = videos[0];

    await sock.sendMessage(
      threadID,
      { text: `Fetching your video from:\n${selectedVideo.title}` },
      { quoted: event }
    );
    
    const dlData = await getData(String(selectedVideo.url), "audio")

    if (!dlData || !dlData.videoUrl) {
      return await sock.sendMessage(
        threadID,
        { text: "Download info not found." },
        { quoted: event }
      );
    }

    const downloadUrl = dlData.videoUrl;
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
