import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

const dataCache = {
  userMoney: [],
  userData: [],
  prefixesData: [],
  groupData: []
};

export async function initSQLite() {
  const dbPath = path.join(__dirname, 'data','data.sqlite');
  db = new sqlite3.Database(dbPath);

  const tables = {
    userMoney: `CREATE TABLE IF NOT EXISTS userMoney (id TEXT PRIMARY KEY, money INTEGER, msgCount INTEGER)`,
    userData: `CREATE TABLE IF NOT EXISTS userData (id TEXT PRIMARY KEY, banned INTEGER DEFAULT 0, name TEXT, data TEXT)`,
    prefixesData: `CREATE TABLE IF NOT EXISTS prefixesData (id TEXT PRIMARY KEY, prefix TEXT)`,
    groupData: `CREATE TABLE IF NOT EXISTS groupData (id TEXT PRIMARY KEY, name TEXT,uid TEXT, msgCount INTEGER, banned INTEGER DEFAULT 0 )`
  };

  for (const sql of Object.values(tables)) {
    await runSQL(sql);
  }

  dataCache.userMoney = await loadTable('userMoney');
  dataCache.userData = await loadTable('userData');
  dataCache.prefixesData = await loadTable('prefixesData');
  dataCache.groupData = await loadTable('groupData');
}

function runSQL(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function allSQL(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function loadTable(tableName) {
  try {
    const rows = await allSQL(`SELECT * FROM ${tableName}`);
    if (tableName === 'userData') {
      return rows.map(row => ({
        id: row.id,
        name: row.name || '',
        banned: row.banned || 0,
      }));
    }
    return rows;
  } catch (err) {
    if (err.message.includes('no such table')) return [];
    throw err;
  }
}

export async function getTable(tableName) {
  if (dataCache[tableName]) {
    return dataCache[tableName];
  } else {
    const data = await loadTable(tableName);
    dataCache[tableName] = data;
    return data;
  }
}

export async function getUserMoney(userId) {
  const data = await getTable('userMoney');
  if (!data || data.length === 0) {
    console.log(`[LOG] No money data found for user ${userId}`);
    return { money: 0, msgCount: 0 };
  }
  const user = data.find(item => item.id === userId);
  return user ? user : { money: 0, msgCount: 0 };
}   

export async function getUserData(userId) {
  const data = await getTable('userData');
  const user = data.find(item => item.id === userId);
  return user ? user : {};
}

export async function getPrefixesData(userId) {
  const data = await getTable('prefixesData');
  const user = data.find(item => item.id === userId);
  return user ? user.prefix : '';
}

export async function getgroupData(groupId) {
  const data = await getTable('groupData');
  const group = data.find(item => item.id === groupId);
  return group ? JSON.parse(group.settings) : {};
}



export async function saveTable(tableName, data) {
  let insertSQL = '';
  let makeParams;

  if (tableName === 'userMoney') {
    insertSQL = `
      INSERT INTO userMoney (id, money, msgCount)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        money = excluded.money,
        msgCount = excluded.msgCount
    `;
    makeParams = (item) => [item.id, item.money ?? 0, item.msgCount ?? 0];
  } else if (tableName === 'userData') {
    insertSQL = `
      INSERT INTO userData (id, banned, name, data)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        banned = excluded.banned,
        name = excluded.name,
        data = excluded.data
    `;
    makeParams = (item) => [
      item.id,
      item.banned ?? 0,
      item.name ?? "",
      item.data ? JSON.stringify(item.data) : null
    ];
  } else if (tableName === 'prefixesData') {
    insertSQL = `
      INSERT INTO prefixesData (id, prefix)
      VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET
        prefix = excluded.prefix
    `;
    makeParams = (item) => [item.id, item.prefix];
  } else if (tableName === 'groupData') {
    insertSQL = `
      INSERT INTO groupData (id, name, uid, msgCount, banned)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        uid = excluded.uid,
        msgCount = excluded.msgCount,
        banned = excluded.banned
    `;
    makeParams = (item) => [item.id, item.name, item.uid, item.msgCount ?? 0, item.banned ?? 0];
  }

  for (const item of data) {
    await runSQL(insertSQL, makeParams(item));
  }
}

export async function setUserBanned(userId, banned = true) {
  const data = await getTable('userData');
  let user = data.find(item => item.id === userId);
  if (user) {
    user.banned = banned ? 1 : 0;
  } else {
    user = { id: userId, banned: banned ? 1 : 0, name: "", data: {} };
    data.push(user);
  }
  await saveTable('userData', data);
  return user;
}

export async function isUserBanned(userId) {
  const data = await getTable('userData');
  const user = data.find(item => item.id === userId);
  return user ? !!user.banned : false;
}

export async function setGroupBanned(groupId, banned = true) {
  const data = await getTable('groupData');
  let group = data.find(item => item.id === groupId);
  if (group) {
    group.banned = banned ? 1 : 0;
  } else {
    group = { id: groupId, uid: "", msgCount: 0, banned: banned ? 1 : 0 };
    data.push(group);
  }
  await saveTable('groupData', data);
  return group;
}

export async function isGroupBanned(groupId) {
  const data = await getTable('groupData');
  const group = data.find(item => item.id === groupId);
  return group ? !!group.banned : false;
}

export { dataCache };
export default {
  initSQLite,
  getTable,
  getUserMoney,
  getUserData,
  getPrefixesData,
  getgroupData,
  saveTable,
  isGroupBanned,
  isUserBanned,
  setUserBanned,
  setGroupBanned
};