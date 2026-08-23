import { readFileSync } from 'fs'

const ACCOUNT_ID = 'ca5d155a8d1dcb2a9ee6770606e12a15'
const DB_ID = 'a6dbf81c-d668-4dc9-ac8e-ff6953005b6a'

const config = readFileSync(`${process.env.APPDATA}/xdg.config/.wrangler/config/default.toml`, 'utf-8')
const tokenMatch = config.match(/oauth_token\s*=\s*"(.+?)"/)
const token = tokenMatch[1]

const statements = [
  `CREATE TABLE IF NOT EXISTS item_files (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id       INTEGER NOT NULL,
    file_name     TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_type     TEXT NOT NULL,
    file_size     INTEGER NOT NULL,
    created_at    TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS file_types (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    extension  TEXT NOT NULL UNIQUE,
    mime_type  TEXT NOT NULL,
    label      TEXT NOT NULL,
    enabled    INTEGER DEFAULT 1
  )`,
  `INSERT OR IGNORE INTO file_types (extension, mime_type, label, enabled) VALUES ('txt', 'text/plain', '純文字檔案', 1)`,
  `INSERT OR IGNORE INTO file_types (extension, mime_type, label, enabled) VALUES ('md', 'text/markdown', 'Markdown 檔案', 1)`,
  `INSERT OR IGNORE INTO file_types (extension, mime_type, label, enabled) VALUES ('png', 'image/png', 'PNG 圖片', 1)`,
  `INSERT OR IGNORE INTO file_types (extension, mime_type, label, enabled) VALUES ('jpg', 'image/jpeg', 'JPG 圖片', 1)`,
  `INSERT OR IGNORE INTO file_types (extension, mime_type, label, enabled) VALUES ('jpeg', 'image/jpeg', 'JPEG 圖片', 1)`,
  `INSERT OR IGNORE INTO file_types (extension, mime_type, label, enabled) VALUES ('gif', 'image/gif', 'GIF 圖片', 1)`,
  `INSERT OR IGNORE INTO file_types (extension, mime_type, label, enabled) VALUES ('pdf', 'application/pdf', 'PDF 文件', 1)`
]

const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ sql: statements.join(';\n') })
})
const result = await res.json()
console.log('Success:', result.success)
if (result.errors?.length) console.log('Errors:', JSON.stringify(result.errors, null, 2))
if (result.messages?.length) console.log('Messages:', JSON.stringify(result.messages, null, 2))
