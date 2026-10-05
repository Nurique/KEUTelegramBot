// SQLite через встроенный node:sqlite. Файл БД общий для админки и процесса бота.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { defaultFlow, flowSchema, type Flow, type Lang } from "./flow";

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "bot.db");

let db: DatabaseSync | undefined;

function getDb(): DatabaseSync {
  if (db) return db;
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 3000;
    CREATE TABLE IF NOT EXISTS flow (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS bot_users (
      chat_id INTEGER PRIMARY KEY,
      lang TEXT,
      first_name TEXT,
      username TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_seen TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

export function loadFlow(): Flow {
  const row = getDb().prepare("SELECT json FROM flow WHERE id = 1").get() as
    | { json: string }
    | undefined;
  if (!row) return defaultFlow;
  const parsed = flowSchema.safeParse(JSON.parse(row.json));
  return parsed.success ? parsed.data : defaultFlow;
}

export function saveFlow(flow: Flow): void {
  getDb()
    .prepare(
      `INSERT INTO flow (id, json, updated_at) VALUES (1, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at`,
    )
    .run(JSON.stringify(flow));
}

export function touchUser(u: {
  chatId: number;
  firstName?: string;
  username?: string;
}): { lang: Lang | null } {
  const d = getDb();
  d.prepare(
    `INSERT INTO bot_users (chat_id, first_name, username) VALUES (?, ?, ?)
     ON CONFLICT(chat_id) DO UPDATE SET first_name = excluded.first_name,
       username = excluded.username, last_seen = datetime('now')`,
  ).run(u.chatId, u.firstName ?? null, u.username ?? null);
  const row = d.prepare("SELECT lang FROM bot_users WHERE chat_id = ?").get(u.chatId) as {
    lang: Lang | null;
  };
  return { lang: row.lang };
}

export function setUserLang(chatId: number, lang: Lang): void {
  getDb().prepare("UPDATE bot_users SET lang = ? WHERE chat_id = ?").run(lang, chatId);
}

export function userStats(): { total: number; kk: number; ru: number } {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) total,
              SUM(lang = 'kk') kk,
              SUM(lang = 'ru') ru
       FROM bot_users`,
    )
    .get() as { total: number; kk: number | null; ru: number | null };
  return { total: row.total, kk: row.kk ?? 0, ru: row.ru ?? 0 };
}
