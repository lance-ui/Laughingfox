export default {
  config: {
    name: "eval",
    countdown: 5,
    role: 1,
    description: "",
    category: "ADMIN",
    usage: ""
  },
  onRun: async ({ sock, args, message, bot, senderID, threadID, font }) => {
    function output(msg) {
      if (
        typeof msg == "number" ||
        typeof msg == "boolean" ||
        typeof msg == "function"
      )
        msg = msg.toString();
      else if (msg instanceof Map) {
        let text = `Map(${msg.size}) `;
        texnamet += JSON.stringify(mapToObj(msg), null, 2);
        msg = text;
      } else if (typeof msg == "object") msg = JSON.stringify(msg, null, 2);
      else if (typeof msg == "undefined") msg = "undefined";

      message.reply(msg);
    }
    function out(msg) {
      output(msg);
    }
    function mapToObj(map) {
      const obj = {};
      map.forEach(function (v, k) {
        obj[k] = v;
      });
      return obj;
    }
    const cmd = `
		(async () => {
			try {
				${args.join(" ")}
			}
			catch(err) {
				console.error(err);
				message.reply(err)
			}
		})()`;
    eval(cmd);
  },
};
