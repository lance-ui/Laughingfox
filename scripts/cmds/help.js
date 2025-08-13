import path, { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  config: {
    name: "help",
    author: "lance",
    version: "1.0.0",
    description: "Get a list of all commands or info about a specific command.",
    usage: "help [page] or help <command>",
    aliase: ["commands", "cmds", "menu"],
    role: 0,
    category: "utility",
  },
  onRun: async ({ sock, font, args, message, threadID, event }) => {
    const imagesPath = path.join(__dirname, "..", "..", "cache", "tmp");
    const images = fs
      .readdirSync(imagesPath)
      .filter(
        (file) =>
          file.endsWith(".png") ||
          file.endsWith(".jpg") ||
          file.endsWith(".webp")
      );
    const randomImage = images[Math.floor(Math.random() * images.length)];
    const imagePath = path.join(
      __dirname,
      "..",
      "..",
      "cache",
      "tmp",
      randomImage
    );

    const commands = Array.from(global.client.commands.values());
    if (args.length > 0 && !isNaN(args[0])) {
      const pageSize = 20;
      let page = parseInt(args[0], 10) || 1;
      if (page < 1) page = 1;

      const categories = {};
      for (const cmd of commands) {
        const cat = cmd.config?.category || "Uncategorized";
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(cmd);
      }

      const sortedCats = Object.keys(categories).sort();
      let allLines = [];
      for (const cat of sortedCats) {
        allLines.push(`\n${font.bold(cat)}:`);
        allLines.push(
          ...categories[cat].map(
            (cmd) =>
              `  • ${font.mono(cmd.config.name)}: ${
                cmd.config.description || "no description"
              }`
          )
        );
      }

      const totalPages = Math.ceil(allLines.length / pageSize);
      if (page > totalPages) page = totalPages;

      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const pageLines = allLines.slice(start, end);

      let helpMessage = `📜 | ${font.bold("Command List")}\n\n`;
      helpMessage += pageLines.join("\n") + "\n\n";
      helpMessage += `Page: [${page}/${totalPages}] | Total Commands: [${commands.length}]\n`;
      helpMessage += `Prefix: [${font.mono(
        String(global.client.config.PREFIX)
      )}]\n`;
      helpMessage += `Use: help <page> or help <command>\n`;

     await sock.sendMessage(threadID, {
        image: {
          url: imagePath,
        },
        caption: helpMessage,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363402203764339@newsletter",
            newsletterName: "Laughingfox",
            serverMessageId: 143,
          },
        },
      });
    }
    if (args.length > 0) {
      const cmdName = args[0].toLowerCase();
      const cmd = commands.find(
        (c) =>
          c.config.name.toLowerCase() === cmdName ||
          (Array.isArray(c.config.aliases) &&
            c.config.aliases.map((a) => a.toLowerCase()).includes(cmdName))
      );
      if (!cmd) {
        return message.reply(
          `No command found with the name or alias "${cmdName}".`
        );
      }
      let info = `📝 | ${font.bold("Command Info")}\n`;
      info += `Name: ${font.mono(cmd.config.name)}\n`;
      info += `Aliases: ${font.mono(
        Array.isArray(cmd.config.aliases) && cmd.config.aliases.length
          ? cmd.config.aliases.join(", ")
          : "None"
      )}\n`;
      info += `Usage: ${
        cmd.config.usage ? font.mono(cmd.config.usage) : "no usage info given"
      }\n`;
      info += `Description: ${
        cmd.config.description || "no description provided"
      }\n`;
      info += `Version: ${cmd.config.version || "not given"}\n`;
      info += `Author: ${cmd.config.author || "unknown"}\n`;
      info += `Role: ${
        typeof cmd.config.role !== "undefined" ? cmd.config.role : "0"
      }\n`;
      return message.reply(info);
    }
    const pageSize = 20;
    let page = 1;

    const categories = {};
    for (const cmd of commands) {
      const cat = cmd.config?.category || "Uncategorized";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd);
    }

    const sortedCats = Object.keys(categories).sort();
    let allLines = [];
    for (const cat of sortedCats) {
      allLines.push(`\n${font.bold(cat)}:`);
      allLines.push(
        ...categories[cat].map(
          (cmd) =>
            `  • ${font.mono(cmd.config.name)}: ${
              cmd.config.description || "no description given"
            }`
        )
      );
    }

    const totalPages = Math.ceil(allLines.length / pageSize);
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageLines = allLines.slice(start, end);

    let helpMessage = `📜 | ${font.bold("Command List")}\n\n`;
    helpMessage += pageLines.join("\n") + "\n\n";
    helpMessage += `Page: [${page}/${totalPages}] | Total Commands: [${commands.length}]\n`;
    helpMessage += `Prefix: [${font.mono(
      String(global.client.config.PREFIX)
    )}]\n`;
    helpMessage += `Use: help <page> or help <command>\n`;

    return await sock.sendMessage(threadID, {
      image: {
        url: imagePath,
      },
      caption: helpMessage,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: "120363402203764339@newsletter",
          newsletterName: "Laughingfox",
          serverMessageId: 143,
        },
      },
    });
  },
};
