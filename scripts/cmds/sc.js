import fs from "fs-extra";
import path, { dirname } from "path";
import axios from "axios";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url))

export default {
  config: {
    name: "soundcloud",
    aliase: ["sc", "scdl"],
    description:
      "Search and download a SoundCloud track by selecting from 5 results",
    usage: "<search query or SoundCloud track URL>",
    role: 1,
    cooldown: 10,
    author: "JARiF",
    version: "1.2",
    category: "media",
  },

  async onRun({ sock, event, args }) {
    const chatId = event.key.remoteJid;
    if (!args[0]) {
      return await sock.sendMessage(chatId, {
        text: "Please provide a search query or SoundCloud track URL!",
      });
    }

    const input = args.join(" ").trim();

    try {
      if (input.startsWith("https://soundcloud.com/")) {
        await downloadAndSendTrack(sock, event, input);
      } else {
        await sock.sendMessage(chatId, {
          text: "Searching SoundCloud, please wait...",
        });

        const searchUrl = `https://kaiz-apis.gleeze.com/api/soundcloud-search?apikey=${global.client.config.keys.kaiz}&title=${encodeURIComponent(input)}`;
        const searchRes = await axios.get(searchUrl);
        const results = searchRes.data.results;

        if (!results || results.length === 0) {
          return await sock.sendMessage(chatId, {
            text: "No results found for your query.",
          });
        }

        let listevent = "Select a track by replying with the number (1-5):\n\n";
        results.slice(0,5).forEach((track, i) => {
          listevent += `${i + 1}. ${track.title} - ${track.artist}\n`;
        });

        const sentevent = await sock.sendMessage(
          chatId,
          { text: listevent },
          { quoted: event }
        );
        global.client.replies.set(sentevent.key.id, {
          commandName: "soundcloud",
          results: results,
        });
      }
    } catch (err) {
      console.error("SoundCloud error:", err);
      await sock.sendMessage(
        chatId,
        {
          text: "Failed to find or download the SoundCloud track. It might be private or unavailable.",
        },
        { quoted: event }
      );
    }
  },
  onReply: async ({ args, event, message, sock, data, threadID }) => {
    const { results } = data;
    if (!args > 5)
      message.reply("❌ Please reply with your selection as text.");
    const choice = parseInt(args);
    try {
      if (isNaN(choice) || choice < 1 || choice > 5) {
        return await sock.sendMessage(
          threadID,
          {
            text: "❌ Invalid selection. Please reply with a number between 1 and 5.",
          },
          { quoted: event }
        );
      }

      const selectedTrack = results[choice - 1];
       const url = selectedTrack.url;
      await downloadAndSendTrack(sock, threadID, url, event);
    } catch (err) {
      console.log(err);
      message.reply(err.message);
    }
  },
};
async function downloadAndSendTrack(sock, threadID, url, event) {
   try {
       const resolveUrl = `https://kaiz-apis.gleeze.com/api/soundcloud-dl?url=${url}&apikey=${global.client.config.keys.kaiz}`;
    const resolveRes = await axios.get(resolveUrl);
    const track = resolveRes.data;

    if (!track || !track.username) throw new Error("Track not found or private.");

    const title = track.title.replace(/[\\/:"*?<>|]+/g, "");
    const tempDir = path.join(__dirname, "cache");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const downloadUrl = track.downloadUrl;

    const filename = path.join(tempDir, `${title}-${Date.now()}.mp3`);
    const writer = fs.createWriteStream(filename);

    const downloadRes = await axios({
      url: downloadUrl,
      method: "GET",
      responseType: "stream",
    });

    downloadRes.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    await sock.sendMessage(threadID,{
        audio: { url: filename },
        mimetype: "audio/mp3"
    },
     { quoted: event }
           );

    fs.unlinkSync(filename);
  } catch (err) {
    console.error("Download error:", err);
    await sock.sendMessage(
      threadID,
      { text: "Error downloading the track." }
    );
  }
}
