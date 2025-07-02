export default {
    config: {
        name: "restart",
        role: 1,
        category: "admin"
    },
    onRun: async ({ message }) => {
        await message.reply("restarting");
        process.exit(2);
    }
};