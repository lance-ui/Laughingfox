import fs from "fs";
import path from "path";
import sharp from "sharp";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

export default {
  config: {
    name: "setpfp",
    role: 1,
    description: "set the bot account pfp",
    category: "admin",
    cooldown: 5
  }, 

  async onRun({ sock, event }) {
    try {
      const quoted = event.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const imageMessage = quoted?.imageMessage || event.message?.imageMessage;

      if (!imageMessage) {
        return sock.sendMessage(
          event.key.remoteJid,
          { text: "⚠️ Please send or reply to an image with the command `.setpfp`." },
          { quoted: event }
        );
      }

      const stream = await downloadContentFromMessage(imageMessage, "image");

      let buffer = Buffer.alloc(0);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const resizedBuffer = await sharp(buffer)
        .resize(640, 640, { fit: "cover" })
        .jpeg()
        .toBuffer();

      const filePath = path.join(__dirname, "../tmp/tmp-pfp.jpg");
      fs.writeFileSync(filePath, resizedBuffer);

      await sock.updateProfilePicture(sock.user.id, resizedBuffer);

      fs.unlinkSync(filePath);

      await sock.sendMessage(
        event.key.remoteJid,
        { text: "✅ Bot profile picture updated successfully!" },
        { quoted: event }
      );
    } catch (error) {
      console.error("Error setting profile picture:", error);
      await sock.sendMessage(
        event.key.remoteJid,
        { text: "❌ Failed to update profile picture." },
        { quoted: event }
      );
    }
  },
};

