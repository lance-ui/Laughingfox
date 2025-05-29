import chalk from "chalk";

const log = {
    info: message => {
        console.log(chalk.blue(`[ FOX SYSTEM | 📀 ]: ${message}`));
    },
    warn: message => {
        console.log(chalk.yellow(`[ FOX SYSTEM | ⚠️ ]: ${message}`));
    },
    success: message => {
        console.log(chalk.green(`[ FOX SYSTEM | ✅ ]: ${message}`));
    },
    error: message => {
        console.log(chalk.red(`[ FOX SYSTEM | ❌ ]: ${message}`));
    }
};

export default log;
