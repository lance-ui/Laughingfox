export default {
    config: {
        name: "help"
    },
    onRun: async ({ message, font }) => {
        let helpMessage = `📜 | ${font.mono("Command List")}\n\n`;

        let commandList = Array.from(global.client.commands.keys())
            .map((name, index) => {
                return `${index + 1}. ${font.mono(name)}`;
            })
            .join("\n");

        helpMessage += commandList + `\n\n`;
        helpMessage += `Total Commands: [ ${global.client.commands.size} ]\n`;
        helpMessage += `Prefix: [ ${font.mono(
            global.client.config.PREFIX
        )} ]\n`;

        await message.reply(helpMessage);
    }
};
