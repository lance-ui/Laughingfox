import { spawn } from "child_process";

export default {
    config: {
        name: "shell",
        description: "bash shell",
        role: 1,
        cooldown: 5
    },

    onRun: async function ({ message, args, font }) {
        const input = args.join(" ");
        if (!input) {
            return message.send("You can not execute an empty command");
        }
        const runner = spawn(input, { shell: true });

        runner.stdout.on("data", data => {
            message.send(
                `👨‍💻 » | ${font.bold(
                    "Console"
                )}\n_____________________\n${data.toString()}`
            );
        });

        runner.stderr.on("data", data => {
            message.send(
                `👨‍💻» | ${font.bold(
                    "Error"
                )}\n________________________\n${data.toString()}`
            );
        });

        runner.on("error", error => {
            message.send(
                `👨‍💻» | ${font.bold("Error")}\n________________________\n${error.message}`
            );
        });

        runner.on("close", code => {
            if (code !== 0) {
                message.send(
                    `👨‍💻» | ${font.bold(
                        "Exit Code"
                    )}\n________________________\nCommand exited with code ${code}`
                );
            }
        });
    }
};