import db, { saveTable } from "../utils/data.js";

const userMoneyMap = new Map();
const userDataMap = new Map();
const prefixesDataMap = new Map();
const groupDataMap = new Map();

const initCache = async () => {
  const userMoneyData = await db.getTable('userMoney');
  const userData = await db.getTable('userData');
  const prefixesData = await db.getTable('prefixesData');
  const groupData = await db.getTable('groupData');

  userMoneyData.forEach((user) => userMoneyMap.set(user.id, user));
  userData.forEach((user) => userDataMap.set(user.id, user));
  prefixesData.forEach((prefix) => prefixesDataMap.set(prefix.id, prefix));
  groupData.forEach((group) => groupDataMap.set(`${group.id}-${group.uid}`, group));
};

initCache();

const OMIT = 30 * 60 * 1000; // 30 minutes

const saveData = async () => {
  try {
    await saveTable('userMoney', Array.from(userMoneyMap.values()));
    await saveTable('userData', Array.from(userDataMap.values()));
    await saveTable('prefixesData', Array.from(prefixesDataMap.values()));
    await saveTable('groupData', Array.from(groupDataMap.values()).map((group) => ({ id: group.id, name: group.name, uid: group.uid, banned: group.banned })));
    
    
    userMoneyMap.clear()
    userDataMap.clear()
    prefixesDataMap.clear()
    groupDataMap.clear()
    
    await initCache()
  } catch (error) {
    console.error("Error saving data:", error);
  }
};

setInterval(saveData, OMIT);

process.on('exit', saveData);
process.on('SIGINT', saveData);
process.on('SIGUSR1', saveData);
process.on('SIGUSR2', saveData);

const handleDatabase = async ({ threadID, senderID, sock }) => {
  try {
    if (!userMoneyMap.has(senderID)) {
      userMoneyMap.set(senderID, { id: senderID, money: 0, msgCount: 0 });
    }

    if (!userDataMap.has(senderID)) {
      userDataMap.set(senderID, { id: senderID, name: "Unknown" });
    }

    if (!prefixesDataMap.has(threadID)) {
      prefixesDataMap.set(threadID, { id: threadID, prefix: global.client.config.PREFIX });
    }
    
    if (!groupDataMap.has(`${threadID}-${senderID}`) && threadID.endsWith("@g.us")) {
      const groupMetadata = async () => {
        const groupInfo = await sock.groupMetadata(threadID);
        return groupInfo ? groupInfo.subject : "Unknown Group";
      };
      const groupName = await groupMetadata();
      groupDataMap.set(`${threadID}-${senderID}`, { id: threadID, name: groupName, uid: senderID, banned: 0 });
    }

    const userMoney = userMoneyMap.get(senderID);
    if (userMoney) {
      userMoney.msgCount = (userMoney.msgCount || 0) + 1;
      userMoneyMap.set(senderID, userMoney);
    }

    const groupData = groupDataMap.get(`${threadID}-${senderID}`);
    if (groupData) {
      groupData.msgCount = (groupData.msgCount || 0) + 1;
      groupDataMap.set(`${threadID}-${senderID}`, groupData);
    }

    const userBanned = await db.isUserBanned(senderID);
    if (userBanned && !global.client.config.admins.includes(senderID.replace("@lid", ""))) {
      return message.send("❌ | You are banned from using the bot.");
    }

    const groupBanned = await db.isGroupBanned(threadID);
    if (groupBanned && !global.client.config.admins.includes(senderID.replace("@lid", ""))) {
      return message.send("❌ | This group is banned");
    }
  } catch (e) {
    console.log(e.message);
  }
};

const setuserBanned = async (userId, banned) => {
  if (userDataMap.has(userId)) {
    const userData = userDataMap.get(userId);
    userData.banned = banned ? 1 : 0;
    userDataMap.set(userId, userData);
    await saveTable('userData', Array.from(userDataMap.values()));
  }
};

const setgroupBanned = async (groupId, banned) => {
  const groupDataArray = Array.from(groupDataMap.values());
  const groupData = groupDataArray.find((group) => group.id === groupId);
  if (groupData) {
    groupData.banned = banned ? 1 : 0;
    groupDataMap.set(`${groupData.id}-${groupData.uid}`, groupData);
    await saveTable('groupData', Array.from(groupDataMap.values()).map((group) => ({ id: group.id, name: group.name, uid: group.uid, banned: group.banned })));
  }
};
export { setgroupBanned, setuserBanned, handleDatabase}
