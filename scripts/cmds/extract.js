import { downloadMediaMessage } from "@whiskeysockets/baileys";

export default {
  config: {
    name: "extract",
    description: "Extract and resend view-once images, videos, or audio.",
    usage: ".extract (reply to view-once media)",
    role: 0,
    cooldown: 5,
    aliases: ["extract", "ex"],
    category: "media",
  },
  onRun: async ({ sock, event }) => {
    const quoted = event.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const jid = event.key.remoteJid;

    const sendText = async (text) => {
      await sock.sendMessage(jid, { text }, { quoted: event });
    };

    if (!quoted) {
      await sendText("Please reply to a view-once image, video, or audio message.");
      return;
    }
    const viewOnce = quoted;
    if (!viewOnce) {
      await sendText("No view-once media found in the replied message.");
      return;
    }

    let type, mediaMsg;
    if (viewOnce.imageMessage) {
      type = "image";
      mediaMsg = { message: { imageMessage: viewOnce.imageMessage } };
    } else if (viewOnce.videoMessage) {
      type = "video";
      mediaMsg = { message: { videoMessage: viewOnce.videoMessage } };
    } else if (viewOnce.audioMessage) {
      type = "audio";
      mediaMsg = { message: { audioMessage: viewOnce.audioMessage } };
    } else {
      await sendText("Unsupported view-once media type.");
      return;
    }

    try {
      const buffer = await downloadMediaMessage(mediaMsg, "buffer");
      if (type === "image") {
        await sock.sendMessage(jid, { image: buffer }, { quoted: event });
      } else if (type === "video") {
        await sock.sendMessage(jid, { video: buffer }, { quoted: event });
      } else if (type === "audio") {
        await sock.sendMessage(jid, { audio: buffer, mimetype: "audio/mp4" }, { quoted: event });
      }
    } catch (e) {
      await sendText("Failed to extract media: " + e.message);
    }
  },
};