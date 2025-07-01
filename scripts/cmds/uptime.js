import os from "os";

const formatUptime = uptime => {
  const days = Math.floor(uptime / (24 * 60 * 60 * 1000));
  uptime %= 24 * 60 * 60 * 1000;
  const hours = Math.floor(uptime / (60 * 60 * 1000));
  uptime %= 60 * 60 * 1000;
  const minutes = Math.floor(uptime / (60 * 1000));
  uptime %= 60 * 1000;
  const seconds = Math.floor(uptime / 1000);
  return `${days}d(s) ${hours}h(s) ${minutes}m(s) ${seconds}s(s)`;
};

const getSystemStats = () => {
  const cpuUsage = (process.cpuUsage().user / 1000000).toFixed(1) + "%";
  const totalMemory = 150;
  const memoryUsage = (process.memoryUsage().rss / (1024 * 1024)).toFixed(2) + " MB";
  const cores = os.cpus().length;
  const platform = os.platform();
  const arch = os.arch();
  const latency = Date.now();
  const ping = Date.now() - latency;
  return { cpuUsage, memoryUsage, totalMemory: `${totalMemory} GB`, cores, platform, arch, ping };
};

export default {
  config: {
    name: "uptime"
  },
  onRun: async ({ message, font }) => {
    const uptime = process.uptime() * 1000;
    const formattedUptime = formatUptime(uptime);
    const { cpuUsage, memoryUsage, totalMemory, cores, platform, arch, ping } = getSystemStats();
    const uptimeMessage = `
    ${font.mono(`Running for: ${formattedUptime}`)}
    ${font.mono(`Cpu usage: ${cpuUsage}`)}
    ${font.mono(`Ram usage: ${memoryUsage} / ${totalMemory}`)}
    ${font.mono(`Cores: ${cores}`)}
    ${font.mono(`Ping: ${ping}`)}
    ${font.mono(`OS Platform: ${platform}`)}
    ${font.mono(`System CPU Architecture: ${arch}`)}
    `;
    await message.reply(uptimeMessage);
  }
};