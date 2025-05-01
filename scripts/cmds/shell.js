import { execSync } from 'child_process';

export default {
  config: {
    name: 'shell',
    description: 'Execute shell commands.',
    usage: '!shell <command>',
    category: 'owner',
    role: 1
  },
  onRun: async (sock, message, args) => {
    if (args.length === 0) {
      return await message.reply('Please provide a shell command to execute.');
    }

    const cmd = args.join(' ');
    await message.reply(`Executing command: ${cmd}...`);

    try {
      const result = execSync(cmd, { encoding: 'utf-8' });

      if (!result) {
        await message.reply('Command executed successfully with no output.');
      } else if (result.length > 10000) {
        await message.reply('Output too large. Executed command successfully.');
      } else {
        await message.reply(`${result}`);
      }
    } catch (error) {
      await message.reply(`Error executing command: ${error.message}`);
    }
  }
};