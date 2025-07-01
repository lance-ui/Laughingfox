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
  groupSettings: []
};

export async function initSQLite() {
  const dbPath = path.join(__dirname, 'data','data.sqlite');
  db = new sqlite3.Database(dbPath);

  const tables = {
    userMoney: `CREATE TABLE IF NOT EXISTS userMoney (id TEXT PRIMARY KEY, money INTEGER, msgCount INTEGER)`,
    userData: `CREATE TABLE IF NOT EXISTS userData (id TEXT PRIMARY KEY, banned INTEGER DEFAULT 0, name TEXT)`,
    prefixesData: `CREATE TABLE IF NOT EXISTS prefixesData (id TEXT PRIMARY KEY, prefix TEXT)`,
    groupSettings: `CREATE TABLE IF NOT EXISTS groupSettings (id TEXT PRIMARY KEY, settings TEXT)`
  };

  for (const sql of Object.values(tables)) {
    await runSQL(sql);
  }

  dataCache.userMoney = await loadTable('userMoney');
  dataCache.userData = await loadTable('userData');
  dataCache.prefixesData = await loadTable('prefixesData');
  dataCache.groupSettings = await loadTable('groupSettings');
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
        data: JSON.parse(row.data)
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
  const user = data.find(item => item.id === userId);
  return user ? { money: user.money, msgCount: user.msgCount } : { money: 0, msgCount: 0 };
}   

export async function getUserData(userId) {
  const data = await getTable('userData');
  const user = data.find(item => item.id === userId);
  return user ? user.data : {};
}

export async function getPrefixesData(userId) {
  const data = await getTable('prefixesData');
  const user = data.find(item => item.id === userId);
  return user ? user.prefix : '';
}

export async function getGroupSettings(groupId) {
  const data = await getTable('groupSettings');
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
      INSERT INTO userData (id, data)
      VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET
        data = excluded.data
    `;
    makeParams = (item) => [item.id, JSON.stringify(item.data)];
  } else if (tableName === 'prefixesData') {
    insertSQL = `
      INSERT INTO prefixesData (id, prefix)
      VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET
        prefix = excluded.prefix
    `;
    makeParams = (item) => [item.id, item.prefix];
  } else if (tableName === 'groupSettings') {
    insertSQL = `
      INSERT INTO groupSettings (id, settings)
      VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET
        settings = excluded.settings
    `;
    makeParams = (item) => [item.id, item.settings];
  }

  for (const item of data) {
    await runSQL(insertSQL, makeParams(item));
  }
}

export { dataCache };
export default {
  initSQLite,
  getTable,
  getUserMoney,
  getUserData,
  getPrefixesData,
  getGroupSettings,
  saveTable
};