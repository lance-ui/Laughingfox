import db from "../../utils/data.js";

export default {
  config: {
    name: "eval",
    countdown: 5,
    role: 1,
    description: "",
    category: "admin",
    usage: ""
  },
  onRun: async ({ sock, args, message, bot, senderID, threadID, font, proto, event }) => {
    const require = (module) => {
      return import(module);
    };

    function output(msg) {
      if (typeof msg == "number" || typeof msg == "boolean" || typeof msg == "function")
        msg = msg.toString();
      else if (msg instanceof Map) {
        let text = `Map(${msg.size}) `;
        text += JSON.stringify(mapToObj(msg), null, 2);
        msg = text;
      } else if (typeof msg == "object")
        msg = JSON.stringify(msg, null, 2);
      else if (typeof msg == "undefined")
        msg = "undefined";
      message.reply(msg);
    }

    function mapToObj(map) {
      const obj = {};
      map.forEach(function (v, k) {
        obj[k] = v;
      });
      return obj;
    }

    try {
      const cmd = args.join(" ");
      const result = await eval(`(async () => { ${cmd} })()`);
      if (typeof result !== "undefined") {
        output(result);
      }
    } catch (error) {
      const errorMessage = [
        `Error: ${error.message}`,
        `Stack: ${error.stack}`,
        `Name: ${error.name}`,
      ].join("\n");
      message.reply(errorMessage);
    }
  },
};