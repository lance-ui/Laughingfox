import fs from "fs-extra";
import path, { dirname } from "path";
import axios from "axios";
import { PasteClient } from "pastebin-api";
import { fileURLToPath } from "url";

const client = new PasteClient(
    global.client.config.keys.pastebin || process.env.PASTEBIN_KEY
);

const cmdsPath = path.join(process.cwd(), "scripts", "cmds");

export default {
    config: {
        name: "cmd",
        description: "Manages commands",
        usage: "!cmd <install/delete/load/bin/file/unload> <commandname.js> [code]",
        category: "owner",
        cooldown: 5,
        role: 1
    },
    onRun: async ({ event, sock, message, args }) => {
        try {
            const __dirname = dirname(fileURLToPath(import.meta.url));
            if (args.length < 2) {
                return message.send("Invalid usage!");
            }
            const action = args[0].toLowerCase();
            const commandName = args[1];
            const commandPath = path.join(cmdsPath, commandName);

            switch (action) {
                case "install":
                case "-i":
                    let code = null;
                    if (!args[2]) {
                        return message.send("Please provide the command code!");
                    } else if (
                        args[2].toLowerCase().startsWith("https") ||
                        args[2].toLowerCase().startsWith("http")
                    ) {
                        try {
                            const response = await axios.get(args[2]);
                            code = response.data;
                        } catch (e) {
                            return message.send(
                                "An error occurred: " + e.message
                            );
                        }
                    } else {
                        code = args.slice(2).join(" ");
                    }
                    await fs.writeFile(commandPath, code);
                    try {
                        const commandModule = await import(commandPath);
                        if (fs.existsSync(commandPath)) {
                            const command = commandModule.default;
                            if (!command.config) {
                                message.send(
                                    `${commandName} does not export config`
                                );
                            } else if (!command.onRun) {
                                message.send(
                                    `${commandName} does not export the function onRun`
                                );
                            } else {
                                global.client.commands.set(
                                    command.config.name,
                                    command
                                );
                                message.send(
                                    `Command ${commandName} installed successfully!`
                                );
                            }
                        }
                    } catch (e) {
                        console.error("Error loading command:", e);
                        return message.send(
                            `Error loading command: ${e.message}`
                        );
                    }
                    break;
                case "unload":
                case "-ul":
                case "-u":
                    const unloadCommandPath = path.join(cmdsPath, args[1]);
                    if (fs.existsSync(unloadCommandPath)) {
                        try {
                            const commandModule = await import(
                                unloadCommandPath
                            );
                            const command = commandModule.default;
                            global.client.commands.delete(command.config.name);
                            message.send(
                                `Command ${commandName} unloaded successfully!`
                            );
                        } catch (e) {
                            console.error("Error unloading command:", e);
                            return message.send(
                                `Error unloading command: ${e.message}`
                            );
                        }
                    } else {
                        message.send(`Command ${commandName} does not exist!`);
                    }
                    break;
                case "delete":
                case "-d":
                    const deleteCommandPath = path.join(cmdsPath, args[1]);
                    if (fs.existsSync(deleteCommandPath)) {
                        await fs.unlink(deleteCommandPath);
                        global.client.commands.delete(
                            commandName.replace(".js", "")
                        );
                        message.send(
                            `Command ${commandName} deleted successfully!`
                        );
                    } else {
                        message.send(`Command ${commandName} not found!`);
                    }
                    break;
                case "load":
                case "-l":
                    const loadCommandPath = path.join(cmdsPath, args[1]);
                    if (fs.existsSync(loadCommandPath)) {
                        try {
                            const commandModule = await import(loadCommandPath);
                            const command = commandModule.default;
                            global.client.commands.set(
                                command.config.name,
                                command
                            );
                            message.send(
                                `Command ${commandName} loaded successfully!`
                            );
                        } catch (e) {
                            console.error("Error loading command:", e);
                            return message.send(
                                `Error loading command: ${e.message}`
                            );
                        }
                    } else {
                        message.send(`Command ${commandName} not found!`);
                    }
                    break;
                case "bin":
                case "-b":
                    const binFileName = args[1];
                    const binFilePath = path.join(cmdsPath, binFileName);
                    if (!fs.existsSync(binFilePath)) {
                        await message.send(
                            `❌ | The file ${binFileName} does not exist.`
                        );
                        return;
                    }
                    const binData = fs.readFileSync(binFilePath, "utf-8");
                    try {
                        const url = await client.createPaste({
                            code: binData,
                            expireDate: "N",
                            format: "javascript",
                            name: binFileName,
                            publicity: 1
                        });
                        if (!url) {
                            await message.send(
                                `❌ | Failed to upload the file to pastebin, please check if the API key is working.`
                            );
                            return;
                        }
                        const id = url.split("/")[3];
                        const rawPaste = "https://pastebin.com/raw/" + id;
                        await message.send(
                            `✅ | Successfully uploaded ${binFileName} to pastebin!\nUrl: ${rawPaste}`
                        );
                    } catch (e) {
                        console.error("Pastebin error:", e);
                        return message.send(
                            `❌ | Failed to upload to pastebin: ${e.message}`
                        );
                    }
                    break;
                case "file":
                case "-f":
                    const fileFileName = args[1];
                    const fileFilePath = path.join(cmdsPath, fileFileName);
                    if (!fs.existsSync(fileFilePath)) {
                        return message.send(
                            `the file ${fileFileName} does not exist`
                        );
                    }
                    const fileData = fs.readFileSync(fileFilePath, "utf-8");
                    message.send(fileData);
                    break;
                default:
                    message.send("unknown action specifield");
            }
        } catch (error) {
            console.error("Error managing command:", error);
            message.send(`Failed to manage command! ${error.message}`);
        }
    }
};
