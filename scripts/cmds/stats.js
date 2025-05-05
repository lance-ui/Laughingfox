import os from "os";
import si from "systeminformation";

export default {
  config: {
    name: "stats",
    description: "Check bot info and vps info",
    usage: "!ping",
    category: "general",
    role: 0,
  },
  onRun: async ({ sock, event, threadID, args }) => {
    const start = Date.now();
    const msg = await sock.sendMessage(
      threadID,
      { text: `𝐍𝐨𝐰 𝐥𝐨𝐚𝐝𝐢𝐧𝐠. . .\n█▒▒▒▒▒▒▒` }
    );

    await new Promise((resolve) => setTimeout(resolve, 500));
    await sock.sendMessage(threadID, {
      text: "████▒▒▒▒▒",
      edit: msg.key,
    });

    await new Promise((resolve) => setTimeout(resolve, 500));
    await sock.sendMessage(threadID, {
      text: `⋘ 𝑙𝑜𝑎𝑑𝑖𝑛𝑔 𝑑𝑎𝑡𝑎... ⋙\n██████▒▒▒`,
      edit: msg.key,
    });

    await new Promise((resolve) => setTimeout(resolve, 500));
    await sock.sendMessage(threadID, {
      text: `⋘ 𝑃𝑙𝑒𝑎𝑠𝑒 𝑤𝑎𝑖𝑡... ⋙\n█████████`,
      edit: msg.key,
    });

    await new Promise((resolve) => setTimeout(resolve, 500));
    const latency = Date.now() - start;
    const sysInfo = await si.system();
    const cpuInfo = await si.cpu();
    const memInfo = await si.mem();
    const nodeInfo = process.versions.node;
    const v8Info = process.versions.v8;

    const report = ` ╭━━━〔 Bot Status 〕━━━╮
│
│ • 🧶Latency: ${latency}ms
│ • 🕚Uptime: ${formatUptime(process.uptime() * 1000)}
│ • 📡CPU Cores: ${os.cpus().length}
│ • 🖥️CPU Model: ${cpuInfo.model}
│ • 💡CPU Speed: ${cpuInfo.speed} GHz
│ ╰━━━〔 Bot Status 〕━━━╯
╭━━━〔 Memory Usage 〕━━━╮
│
│ • 🔋Total: ${formatBytes(memInfo.total)}
│ • 🪫Used: ${formatBytes(memInfo.active)}
│ • 🖲️Free: ${formatBytes(memInfo.free)}
│ ╰━━━〔 Memory Usage 〕━━━╯
╭━━━〔 System Info 〕━━━╮
│
│ • 💻Platform: ${os.platform()} (${os.arch()})
│ • 📱Hostname: ${os.hostname()}
│ • ⚙️Node.js: ${nodeInfo}
│ • 🛠️V8 Engine: ${v8Info}
│ • 📊OS: ${getOSInfo()}
│ ╰━━━〔 System Info 〕━━━╯
╭━━━〔 Bot Information 〕━━━╮
│
│ • 👭Users: not yet
│ • 👭Threads: not yet
│ • 👤Contact Admin: not yet
│ ╰━━━〔 Bot Information 〕━━━╯ `;

    await sock.sendMessage(threadID, {
      text: report,
      edit: msg.key,
    });
  },
};

function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

function formatUptime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
}

function getOSInfo() {
  return `${os.type()} ${os.release()} ${os.arch()}`;
}