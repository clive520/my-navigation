import { readFileSync } from 'fs'

const ACCOUNT_ID = 'ca5d155a8d1dcb2a9ee6770606e12a15'
const DB_ID = 'a6dbf81c-d668-4dc9-ac8e-ff6953005b6a'

const config = readFileSync(`${process.env.APPDATA}/xdg.config/.wrangler/config/default.toml`, 'utf-8')
const tokenMatch = config.match(/oauth_token\s*=\s*"(.+?)"/)
const TOKEN = tokenMatch[1]

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
}

async function execSQL(sql, params = []) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`
  const body = params.length > 0 ? { sql, params } : { sql }
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  const data = await res.json()
  if (!data.success) console.log('Error:', data.errors)
  return data
}

// 建立資料表
console.log('建立資料表...')
await execSQL(`CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)`)

await execSQL(`CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
)`)

await execSQL(`CREATE TABLE IF NOT EXISTS item_tags (
  item_id INTEGER,
  tag_id INTEGER,
  PRIMARY KEY (item_id, tag_id)
)`)
console.log('資料表建立完成')

// 插入標籤
console.log('插入標籤...')
const tagNames = ['工具', '學習', '娛樂', '開發', '設計', '商業', 'AI', '其他']
for (const name of tagNames) {
  await execSQL('INSERT INTO tags (name) VALUES (?)', [name])
}

// 查詢標籤
const tagResult = await execSQL('SELECT * FROM tags')
const tags = tagResult.result?.[0]?.results || []
const tagNameToId = {}
for (const t of tags) tagNameToId[t.name] = t.id
console.log('標籤:', tagNameToId)

// 插入項目
console.log('插入項目...')
const items = [
  { name: 'GitHub', url: 'https://github.com', description: '程式碼版本控制平台', sort_order: 1, tag: '開發' },
  { name: 'YouTube', url: 'https://youtube.com', description: '影片分享平台', sort_order: 2, tag: '娛樂' },
  { name: 'Notion', url: 'https://notion.so', description: '線上筆記與知識管理', sort_order: 3, tag: '工具' },
  { name: 'Figma', url: 'https://figma.com', description: 'UI 設計工具', sort_order: 4, tag: '設計' },
  { name: 'ChatGPT', url: 'https://chat.openai.com', description: 'AI 對話助手', sort_order: 5, tag: 'AI' },
  { name: 'Udemy', url: 'https://udemy.com', description: '線上課程平台', sort_order: 6, tag: '學習' },
  { name: 'Stripe', url: 'https://stripe.com', description: '線上金流服務', sort_order: 7, tag: '商業' },
  { name: '字幕工坊 SRT Studio', url: 'https://srt-studio-iota.vercel.app/', description: '線上 SRT 字幕編輯工具，可直接在瀏覽器中編輯字幕檔案，支援時間軸調整、文字修改與格式匯出。', sort_order: 8, tag: '工具' },
]

for (const item of items) {
  const r = await execSQL(
    'INSERT INTO items (name, url, description, sort_order) VALUES (?, ?, ?, ?)',
    [item.name, item.url, item.description, item.sort_order]
  )
  const itemId = r.result?.[0]?.meta?.last_row_id
  if (itemId && tagNameToId[item.tag]) {
    await execSQL('INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)', [itemId, tagNameToId[item.tag]])
  }
  console.log(`  ${item.name} (ID:${itemId}) -> ${item.tag}`)
}

// 驗證
console.log('\n驗證:')
const verify = await execSQL(`
  SELECT i.name, i.description, GROUP_CONCAT(t.name) as tags
  FROM items i
  LEFT JOIN item_tags it ON i.id = it.item_id
  LEFT JOIN tags t ON it.tag_id = t.id
  GROUP BY i.id ORDER BY i.sort_order
`)
for (const row of verify.result?.[0]?.results || []) {
  console.log(`  ${row.name} [${row.tags}] - ${row.description}`)
}
