import axios from "axios";

export default {
  config: {
    name: "fbdl",
    cooldown: 30,
    aliese: ["facebook", "fbvideo", "fb"],
    description: "Download Facebook videos",
    category: "media",
    usage: "!fbdl <Facebook video URL>"
  },

  async onRun({ sock, event, args }) {
    const chatId = event.key.remoteJid;

    if (args.length === 0) {
      return await sock.sendMessage(
        chatId,
        {
          text: "Please provide a Facebook video URL.\nUsage:!fbdl <Facebook video URL>"
        },
        { quoted: event }
      );
    }
    const url = args.join("");
    if (!url.match(/^https?:\/\/(www\.)?facebook\.com\/(?:.+\/videos\/.+|watch\/.+|\d+\/videos\/.+|.*\/videos\/\d+|story\.php\?story_fbid=\d+&id=\d+|video\.php\?v=\d+|share\/r\/.+)/i)) {
      return await sock.sendMessage(
        chatId,
        {
          text: "Invalid Facebook video URL. Please provide a valid URL."
        },
        { quoted: event }
      );
    }

    try {
      const apiUrl = `https://myapi-2f5b.onrender.com/fbvideo/search?url=${encodeURIComponent(url)}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data ||!data.hd) {
        return await sock.sendMessage(
          chatId,
          {
            text: "Failed to retrieve download link. Please try again later."
          },
          { quoted: event }
        );
      }

      await sock.sendMessage(
        chatId,
        {
          video: { url: data.hd },
          mimetype: "video/mp4",
          caption: "Here is your Facebook video"
        },
        { quoted: event }
      );
    } catch (error) {
      await sock.sendMessage(
        chatId,
        {
          text: "An error occurred while downloading the video. Please try again later."
        },
        { quoted: event }
      );
    }
  }
};