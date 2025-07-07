import { Sticker, StickerTypes } from "wa-sticker-formatter";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

export default {
  config: {
    name: "sticker",
    description: "Create a sticker from an image, GIF, or short video.",
    usage: ".sticker (reply to media)",
    role: 0,
  },
  onRun: async ({ sock, event }) => {
    const quoted = event.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const jid = event.key.remoteJid;

    const sendText = async (text) => {
      await sock.sendMessage(jid, { text }, { quoted: event });
    };

    if (!quoted) {
      await sendText("Please reply to an image, GIF, or short video to create a sticker.");
      return;
    }

    let mediaBuffer;
    if (quoted.imageMessage) {
      mediaBuffer = await downloadMediaMessage(
        { message: { imageMessage: quoted.imageMessage } },
        "buffer"
      );
    } else if (quoted.videoMessage) {
      if (quoted.videoMessage.seconds > 10) {
        await sendText("Video too long. Please use a video under 10 seconds.");
        return;
      }
      mediaBuffer = await downloadMediaMessage(
        { message: { videoMessage: quoted.videoMessage } },
        "buffer"
      );
    } else if (quoted.stickerMessage && quoted.stickerMessage.isAnimated) {
      mediaBuffer = await downloadMediaMessage(
        { message: { stickerMessage: quoted.stickerMessage } },
        "buffer"
      );
    } else {
      await sendText("Unsupported media type. Please reply to an image, GIF, or short video.");
      return;
    }

    try {
      const sticker = new Sticker(mediaBuffer, {
        type: StickerTypes.FULL,
        pack: "Laughingfox",
        author: "Bot",
      });
      const stickerBuffer = await sticker.toBuffer();
      await sock.sendMessage(jid, { sticker: stickerBuffer }, { quoted: event });
    } catch (e) {
      await sendText("Failed to create sticker: " + e.message);
    }
  },
};
