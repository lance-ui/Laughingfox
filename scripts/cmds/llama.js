import fetch from "node-fetch";


const getResponse = async (prompt,id) => {
  const apiURL = "https://kaiz-apis.gleeze.com/api/groq-completions";
  const res = await fetch(`${apiURL}?ask=${prompt}&uid=${id}&apikey=${global.client.config.keys.kaiz}&model=llama-3.1-8b-instant`);
  return res
}

export default {
  config: {
    name: "llama",
    description: "Talk to the advanced AI model llama-3",
    category: "ai"
  },
  async onRun({ event, sock, args, threadID, senderID }) {
    let text = args.join(" ");

    try {
      const res = await getResponse(text,senderID)
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const output = data.response;

      if (!output) {
        return await sock.sendMessage(threadID, {
          text: "llama didn't return a valid response.",
        }, { quoted: event });
      }

      const msg = await sock.sendMessage(threadID, {
          text: `${output}`,
        }, { quoted: event });
        
      global.client.replies.set(msg.key.id,{ commandName: this.config.name })
    } catch (err) {
      await sock.sendMessage(threadID, {
        text: "❌ Failed to connect to  ai.\n\n" + err.message,
      }, { quoted: event });
    }
  },
  async onReply({ event, args, sock, threadID, senderID }){
    try {
      const res = await getResponse(args,senderID)
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const output = data.response;

      if (!output) {
        return await sock.sendMessage(threadID, {
          text: "aria didn't return a valid response.",
        }, { quoted: event });
      }

      const msg = await sock.sendMessage(threadID, {
          text: `${output}`,
        }, { quoted: event });
        
      global.client.replies.set(msg.key.id,{ commandName: this.config.name })
    } catch (err) {
      await sock.sendMessage(threadID, {
        text: "❌ Failed to connect to  ai.\n\n" + err.message,
      }, { quoted: event });
    }
  }
};