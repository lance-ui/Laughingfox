export default {
  config: {
    name: "thread",
    description: "Ban or unban a group from using the bot",
    usage: ".thread ban|-b or .group unban|-un",
    role: 2,
  },
  onRun: async ({ threadID, args, message, setGroupBanned }) => {
    const action = (args[0] || "").toLowerCase();

    if (action === "ban" || action === "-b") {
      await setGroupBanned(threadID, true);
      await message.reply("This group has been banned from using the bot.");
    } else if (action === "unban" || action === "-un") {
      await setGroupBanned(threadID, false);
      await message.reply("This group has been unbanned.");
    } else {
      await message.reply("Usage: .group ban|-b or .group unban|-un");
    }
  },
};