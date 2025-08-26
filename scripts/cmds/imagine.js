import axios from "axios";
export default {
  config: {
    name: "imagine",
    author: "lance",
    version: "1.0",
    description: "Generate images from text prompt and send all images",
    usage: "imagine prompt",
    aliase: ["texttoimage"],
    role: 0,
    category: "ai-image-gen",
  },

  onRun: async function ({ message, args, sock, event }) {
    try {
      if (!args) {
        return await message.reply("⚠️ Please provide a prompt.");
      }

      let prompt = args.join(" ");
      if (!prompt) {
        return await message.reply("⚠️ Please provide a valid prompt.");
      }

      await message.reply(`⏳ Generating  your  image`);

      const response = await axios.get(`https://theone-fast-image-gen.vercel.app/download-image?prompt=${encodeURIComponent(prompt)}&expires=${Date.now() + 10000}&size=16%3A9`, { responseType: "arraybuffer" });
        const buffer = Buffer.from(response.data, "binary");

        await sock.sendMessage(
          event.key.remoteJid,
          {
            image: buffer,
            mimetype: "image/jpeg",
            caption: `✅ Image generation completed.\nPrompt: ${prompt}`,
          },
          {
            quoted: event,
          }
        );
    } catch (error) {
      console.error("Image generation error:", error.message || error);
      await message.reply("❌ Failed to generate image.");
    }
  },
};
