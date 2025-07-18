import fetch from "node-fetch";
import fs from "fs-extra";
import path from "path";

export default {
  config: {
    name: "dl",
    description: "Download YouTube videos or audio",
    category: "media",
    usage: "dl [-a|-v] <search query>",
  },
  onRun: async ({ args, event, font, sock, threadID }) => {
    let type = null;
    let query = null;

    if (args[0] && args[0].startsWith("-")) {
      if (args[0] === "-a") type = "audio";
      else if (args[0] === "-v") type = "video";
      query = args.slice(1).join(" ");
    } else {
      query = args.join(" ");
    }

    if (!query) {
      return sock.sendMessage(threadID, {
        text: `${font.bold("Error:")} Search query is required.`,
      });
    }

    const encodedQuery = encodeURIComponent(query);
    const url = `https://romektricks-subzero-yt.hf.space/yt?query=${encodedQuery}`;
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.success) {
        return sock.sendMessage(threadID, {
          text: `${font.bold("Error:")} Failed to retrieve data.`,
        });
      }

      const videoId = data.result.videoId;
      const downloadUrl = data.result.download[type || "video"];

      if (!downloadUrl) {
        return sock.sendMessage(threadID, {
          text: `${font.bold("Error:")} Download URL not found.`,
        });
      }

      const filePath = path.join(process.cwd(), `scripts/cmds/cache/${videoId}.${type === "audio" ? "mp3" : "mp4"}`);

      const downloadResponse = await fetch(downloadUrl);
      const writer = fs.createWriteStream(filePath)
      downloadResponse.body.pipe(writer);
      
      await new Promise((res,rej) => {
          writer.on("finish", res)
          writer.on("error", rej)
      })
      
      await sock.sendMessage(threadID, {
        [type === "audio" ? "audio" : "video"]: {
          url: filePath,
        },
        caption: `${font.mono(data.result.title)}\n${font.sans(`Duration: ${data.result.duration.timestamp}`)}\n${font.bold(`Views: ${data.result.views}`)}`,
      });

      await fs.unlink(filePath);
    } catch (error) {
      console.error(error);
      sock.sendMessage(threadID, {
        text: `${font.bold("Error:")} An error occurred while processing your request.`,
      });
    }
  },
};