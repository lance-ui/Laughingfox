export default {
  config: {
    name: "thread",
    description: "Ban, unban, or list groups using the bot",
    usage: ".thread ban|-b | .thread unban|-un | .thread list|-l",
    role: 2,
  },
  onRun: async ({ threadID, args, message, setgroupBanned, getTable }) => {
    const action = (args[0] || "").toLowerCase();

    if (action === "ban" || action === "-b") {
      await setgroupBanned(threadID, true);
      await message.reply("This group has been banned from using the bot.");
    } else if (action === "unban" || action === "-un") {
      await setgroupBanned(threadID, false);
      await message.reply("This group has been unbanned.");
    } else if (action === "list" || action === "-l") {
      const groups = await getTable("groupData");
      console.log("Groups in database:", groups);
      if (!groups.length) {
        await message.reply("No groups found in the database.");
        return;
      }
      let msg = [];
      for (const n of groups) {
        if (msg.includes("• " + String(n.name))) {
          continue;
        }
        msg.push("• " + String(n.name));
      }
      const names = msg.join(`\n`);
      await message.reply(`Groups in database:\n${names}`);
    } else if ((action === "find" || action === "-f" || action === "-s") && args[1]) {
      const query = args.slice(1).join(" ").toLowerCase();
      const groups = await getTable("groupData");
      const found = groups.find(
        g => {
          if (g.name === query || g.name.toLowerCase() === query) return true;
        }
      );
      if (found) {
        await message.reply(
          `Group found:\nName: ${found.name || "Unknown"}\nID: ${found.id || found.uid || "Unknown"}`
        );
      } else {
        await message.reply("No group found matching your query.");
      }
    } else {
      await message.reply("Usage: .group ban|-b | .group unban|-un | .group list|-l | .group find <name|id>");
    }
  },
};