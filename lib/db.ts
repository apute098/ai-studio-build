import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'dev.db');
const db = new Database(dbPath);

// Initialize tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS Message (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    messageId INTEGER,
    chatId TEXT,
    text TEXT,
    username TEXT,
    firstName TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS TelegramUser (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegramId TEXT UNIQUE,
    username TEXT,
    firstName TEXT,
    lastName TEXT,
    lastMessage TEXT,
    messageCount INTEGER DEFAULT 0,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS SystemLog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event TEXT,
    details TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;
