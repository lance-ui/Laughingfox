import dotenv from "dotenv";
dotenv.config();
import log from "./log.js";
import path, { dirname } from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function loadCommands() {
    const errs = {};
    const commandsPath = path.join(__dirname, "..", "scripts", "cmds");

    try {
        log.info("loading commands");
        const commandFiles =
            fs.readdirSync(commandsPath).filter(file => file.endsWith(".js")) ||
            file.endsWith(".ts");

        for (const file of commandFiles) {
            try {
                const commandModule = await import(
                    path.join(commandsPath, file)
                );
                const command = commandModule.default;
                if (!command) {
                    throw new Error(`Error: ${file} does not export anything!`);
                } else if (!command.config) {
                    throw new Error(`Error: ${file} does not export config!`);
                } else {
                    global.client.commands.set(command.config.name, command);
                    if (command.config?.aliase) {
                        global.client.commands.set(
                            command.config.aliase,
                            command
                        );
                    } else if (command.config.cooldown) {
                        global.client.cooldowns.set(
                            command.config.cooldown,
                            []
                        );
                    }
                    log.success(`${command.config.name} successfully loaded`);
                }
            } catch (error) {
                log.error(`Error loading command ${file}: ${error.message}`);
            }
        }
    } catch (error) {
        log.error(error.message);
    }
    return Object.keys(errs).length === 0 ? false : errs;
}
async function loadEvents() {
    log.info("loading events");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const eventsPath = path.join(__dirname, "..", "scripts", "events");
    const eventFiles = fs
        .readdirSync(eventsPath)
        .filter(file => file.endsWith(".js"));

    for (const file of eventFiles) {
        try {
            const eventModule = await import(path.join(eventsPath, file));
            const event = eventModule.default;
            if (!event) {
                throw new Error(`Error: ${file} does not export anything!`);
            } else if (!event.config) {
                throw new Error(`Error: ${file} does not export config`);
            } else if (!event.onEvent) {
                throw new Error(`Error: ${file} does not export onEvent!`);
            } else {
                global.client.events.set(event.config.name, event);
                log.success(`${event.config.name} successfully loaded`);
            }
        } catch (error) {
            log.error(`Error loading event ${file}: ${error.message}`);
        }
    }
}

const loadAll = async () => {
    await loadCommands();
    await loadEvents();
};
function apply(text, fontMap) {
    return text.replace(/[a-zA-Z0-9]/g, char => fontMap[char] || char);
}

const sans = {
    a: "𝖺",
    b: "𝖻",
    c: "𝖼",
    d: "𝖽",
    e: "𝖾",
    f: "𝖿",
    g: "𝗀",
    h: "𝗁",
    i: "𝗂",
    j: "𝗃",
    k: "𝗄",
    l: "𝗅",
    m: "𝗆",
    n: "𝗇",
    o: "𝗈",
    p: "𝗉",
    q: "𝗊",
    r: "𝗋",
    s: "𝗌",
    t: "𝗍",
    u: "𝗎",
    v: "𝗏",
    w: "𝗐",
    x: "𝗑",
    y: "𝗒",
    z: "𝗓",
    A: "𝖠",
    B: "𝖡",
    C: "𝖢",
    D: "𝖣",
    E: "𝖤",
    F: "𝖥",
    G: "𝖦",
    H: "𝖧",
    I: "𝖨",
    J: "𝖩",
    K: "𝖪",
    L: "𝖫",
    M: "𝖬",
    N: "𝖭",
    O: "𝖮",
    P: "𝖯",
    Q: "𝖰",
    R: "𝖱",
    S: "𝖲",
    T: "𝖳",
    U: "𝖴",
    V: "𝖵",
    W: "𝖶",
    X: "𝖷",
    Y: "𝖸",
    Z: "𝖹",
    0: "𝟢",
    1: "𝟣",
    2: "𝟤",
    3: "𝟥",
    4: "𝟦",
    5: "𝟧",
    6: "𝟨",
    7: "𝟩",
    8: "𝟪",
    9: "𝟫"
};

const bold = {
    a: "𝗮",
    b: "𝗯",
    c: "𝗰",
    d: "𝗱",
    e: "𝗲",
    f: "𝗳",
    g: "𝗴",
    h: "𝗵",
    i: "𝗶",
    j: "𝗷",
    k: "𝗸",
    l: "𝗹",
    m: "𝗺",
    n: "𝗻",
    o: "𝗼",
    p: "𝗽",
    q: "𝗾",
    r: "𝗿",
    s: "𝘀",
    t: "𝘁",
    u: "𝘂",
    v: "𝘃",
    w: "𝘄",
    x: "𝘅",
    y: "𝘆",
    z: "𝘇",
    A: "𝗔",
    B: "𝗕",
    C: "𝗖",
    D: "𝗗",
    E: "𝗘",
    F: "𝗙",
    G: "𝗚",
    H: "𝗛",
    I: "𝗜",
    J: "𝗝",
    K: "𝗞",
    L: "𝗟",
    M: "𝗠",
    N: "𝗡",
    O: "𝗢",
    P: "𝗣",
    Q: "𝗤",
    R: "𝗥",
    S: "𝗦",
    T: "𝗧",
    U: "𝗨",
    V: "𝗩",
    W: "𝗪",
    X: "𝗫",
    Y: "𝗬",
    Z: "𝗭",
    0: "𝟬",
    1: "𝟭",
    2: "𝟮",
    3: "𝟯",
    4: "𝟰",
    5: "𝟱",
    6: "𝟲",
    7: "𝟳",
    8: "𝟴",
    9: "𝟵"
};

const mono = {
    a: "𝚊",
    b: "𝚋",
    c: "𝚌",
    d: "𝚍",
    e: "𝚎",
    f: "𝚏",
    g: "𝚐",
    h: "𝚑",
    i: "𝚒",
    j: "𝚓",
    k: "𝚔",
    l: "𝚕",
    m: "𝚖",
    n: "𝚗",
    o: "𝚘",
    p: "𝚙",
    q: "𝚚",
    r: "𝚛",
    s: "𝚜",
    t: "𝚝",
    u: "𝚞",
    v: "𝚟",
    w: "𝚠",
    x: "𝚡",
    y: "𝚢",
    z: "𝚣",
    A: "𝙰",
    B: "𝙱",
    C: "𝙲",
    D: "𝙳",
    E: "𝙴",
    F: "𝙵",
    G: "𝙶",
    H: "𝙷",
    I: "𝙸",
    J: "𝙹",
    K: "𝙺",
    L: "𝙻",
    M: "𝙼",
    N: "𝙽",
    O: "𝙾",
    P: "𝙿",
    Q: "𝚀",
    R: "𝚁",
    S: "𝚂",
    T: "𝚃",
    U: "𝚄",
    V: "𝚅",
    W: "𝚆",
    X: "𝚇",
    Y: "𝚈",
    Z: "𝚉",
    1: "𝟷",
    2: "𝟸",
    3: "𝟹",
    4: "𝟺",
    5: "𝟻",
    6: "𝟼",
    7: "𝟽",
    8: "𝟾",
    9: "𝟿",
    0: "𝟶"
};

const origin = {
    "𝗮": "a",
    "𝗯": "b",
    "𝗰": "c",
    "𝗱": "d",
    "𝗲": "e",
    "𝗳": "f",
    "𝗴": "g",
    "𝗵": "h",
    "𝗶": "i",
    "𝗷": "j",
    "𝗸": "k",
    "𝗹": "l",
    "𝗺": "m",
    "𝗻": "n",
    "𝗼": "o",
    "𝗽": "p",
    "𝗾": "q",
    "𝗿": "r",
    "𝘀": "s",
    "𝘁": "t",
    "𝘂": "u",
    "𝘃": "v",
    "𝘄": "w",
    "𝘅": "x",
    "𝘆": "y",
    "𝘇": "z",
    "𝗔": "A",
    "𝗕": "B",
    "𝗖": "C",
    "𝗗": "D",
    "𝗘": "E",
    "𝗙": "F",
    "𝗚": "G",
    "𝗛": "H",
    "𝗜": "I",
    "𝗝": "J",
    "𝗞": "K",
    "𝗟": "L",
    "𝗠": "M",
    "𝗡": "N",
    "𝗢": "O",
    "𝗣": "P",
    "𝗤": "Q",
    "𝗥": "R",
    "𝗦": "S",
    "𝗧": "T",
    "𝗨": "U",
    "𝗩": "V",
    "𝗪": "W",
    "𝗫": "X",
    "𝗬": "Y",
    "𝗭": "Z",
    "𝖠": "A",
    "𝖡": "B",
    "𝖢": "C",
    "𝖣": "D",
    "𝖤": "E",
    "𝖥": "F",
    "𝖦": "G",
    "𝖧": "H",
    "𝖨": "I",
    "𝖩": "J",
    "𝖪": "K",
    "𝖫": "L",
    "𝖬": "M",
    "𝖭": "N",
    "𝖮": "O",
    "𝖯": "P",
    "𝖰": "Q",
    "𝖱": "R",
    "𝖲": "S",
    "𝖳": "T",
    "𝖴": "U",
    "𝖵": "V",
    "𝖶": "W",
    "𝖷": "X",
    "𝖸": "Y",
    "𝖹": "Z",
    "𝟬": 0,
    "𝟭": 1,
    "𝟮": 2,
    "𝟯": 3,
    "𝟰": 4,
    "𝟱": 5,
    "𝟲": 6,
    "𝟳": 7,
    "𝟴": 8,
    "𝟵": 9,
    "𝟢": 0,
    "𝟣": 1,
    "𝟤": 2,
    "𝟥": 3,
    "𝟦": 4,
    "𝟧": 5,
    "𝟨": 6,
    "𝟩": 7,
    "𝟪": 8,
    "𝟫": 9
};

const font = {
    mono: text => apply(text, mono),
    sans: text => apply(text, sans),
    bold: text => apply(text, bold),
    origin: text => apply(text, origin)
};

async function saveCreds(creds) {
    try {
        const sessionDir = path.join(__dirname,"..", "auth_info_baileys");
        await fs.writeFile(
            path.join(sessionDir, "creds.json"),
            JSON.stringify(creds)
        );
        log.info("Authentication credentials saved successfully");
    } catch (error) {
        log.error("Error saving authentication credentials:", error);
    }
}

async function processSessionData() {
    log.info("Processing session data...");
    if (!process.env.SESSION_DATA) {
        log.info("No session data found in environment variables.");
        return false;
    }

    const decodedSessionData = Buffer.from(
        process.env.SESSION_DATA,
        "base64"
    ).toString("utf-8");
    const sessionDir = path.join(__dirname,"..", "cache", "auth_info_baileys");
    let sessionData;
    try {
        sessionData = JSON.parse(decodedSessionData);
    } catch (error) {
        log.error("Error parsing session data:", error);
        return false;
    }

    await fs.ensureDir(sessionDir);

    const credsFilePath = path.join(sessionDir, "creds.json");
    await fs.ensureFile(credsFilePath);

    try {
        await fs.writeFile(credsFilePath, JSON.stringify(sessionData, null, 2));
        log.success("Session data written to creds.json file.");
        return true;
    } catch (error) {
        log.error("Error writing session data to creds.json file:", error);
        return false;
    }
}

const utils = {
    loadAll,
    loadCommands,
    loadEvents,
    font,
    saveCreds,
    processSessionData
};
export default utils;