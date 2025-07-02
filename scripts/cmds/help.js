export default {
    config: {
        name: "help"
    },
    onRun: async ({ message, font, args }) => {
        const commands = Array.from(global.client.commands.values());

        if (args.length > 0) {
            const cmdName = args[0].toLowerCase();
            const cmd =
                commands.find(
                    c =>
                        c.config.name.toLowerCase() === cmdName ||
                        (Array.isArray(c.config.aliase) &&
                            c.config.aliase.map(a => a.toLowerCase()).includes(cmdName))
                );
            if (!cmd) {
                return message.reply(`No command found with the name or alias "${cmdName}".`);
            }
            let info = `📝 | ${font.bold("Command Info")}\n`;
            info += `Name: ${font.mono(cmd.config.name)}\n`;
            info += `Aliases: ${font.mono(
                Array.isArray(cmd.config.aliase) && cmd.config.aliases.length
                    ? cmd.config.aliase.join(", ")
                    : "None"
            )}\n`;
            info += `Usage: ${cmd.config.usage ? font.mono(cmd.config.usage) : "None"}\n`;
            info += `Description: ${cmd.config.description || "None"}\n`;
            info += `Version: ${cmd.config.version || "N/A"}\n`;
            info += `Author: ${cmd.config.author || "N/A"}\n`;
            info += `Role: ${typeof cmd.config.role !== "undefined" ? cmd.config.role : "N/A"}\n`;
            return message.reply(info);
        }

        const categories = {};
        for (const cmd of commands) {
            const cat = cmd.config?.category || "Uncategorized";
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(cmd);
        }

        const pageSize = 8;
        let page = parseInt(args[0], 10) || 1;
        if (page < 1) page = 1;

        const sortedCats = Object.keys(categories).sort();
        let allLines = [];
        for (const cat of sortedCats) {
            allLines.push(`\n${font.bold(cat)}:`);
            allLines.push(
                ...categories[cat].map(
                    cmd => `  • ${font.mono(cmd.config.name)}: ${cmd.config.description || ""}`
                )
            );
        }

        const totalPages = Math.ceil(allLines.length / pageSize);
        if (page > totalPages) page = totalPages;

        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const pageLines = allLines.slice(start, end);

        let helpMessage = `📜 | ${font.mono("Command List")}\n`;
        helpMessage += pageLines.join("\n") + "\n\n";
        helpMessage += `Page: [${page}/${totalPages}] | Total Commands: [${commands.length}]\n`;
        helpMessage += `Prefix: [${font.mono(String(global.client.config.PREFIX))}]\n`;
        helpMessage += `Use: help <page> or help <command>\n`;

        await message.reply(helpMessage);
    }
};
