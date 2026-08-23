import { readFileSync } from 'fs'

const ACCOUNT_ID = 'ca5d155a8d1dcb2a9ee6770606e12a15'
const DB_ID = '32fcda15-995a-46e5-aba6-775ebebe2796'

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
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })
  return await res.json()
}

// 刪除所有資料
console.log('刪除所有資料...')
await execSQL('DELETE FROM item_tags')
await execSQL('DELETE FROM items')
await execSQL('DELETE FROM tags')

// 使用參數化查詢插入標籤（確保 UTF-8）
console.log('插入標籤...')
const tags = ['工具', '學習', '娛樂', '開發', '設計', '商業', 'AI', '其他']
for (const name of tags) {
  const r = await execSQL('INSERT INTO tags (name) VALUES (?)', [name])
  console.log(`  插入標籤: ${name} - success: ${r.success}`)
}

// 查詢標籤
const tagResult = await execSQL('SELECT * FROM tags')
console.log('標籤查詢結果:', JSON.stringify(tagResult.result?.[0]?.results, null, 2))

// 插入項目
console.log('插入項目...')
const items = [
  ['GitHub', 'https://github.com', '程式碼版本控制平台', 1],
  ['YouTube', 'https://youtube.com', '影片分享平台', 2],
  ['Notion', 'https://notion.so', '線上筆記與知識管理', 3],
  ['Figma', 'https://figma.com', 'UI 設計工具', 4],
  ['ChatGPT', 'https://chat.openai.com', 'AI 對話助手', 5],
  ['Udemy', 'https://udemy.com', '線上課程平台', 6],
  ['Stripe', 'https://stripe.com', '線上金流服務', 7],
  ['字幕工坊 SRT Studio', 'https://srt-studio-iota.vercel.app/', '線上 SRT 字幕編輯工具，可直接在瀏覽器中編輯字幕檔案，支援時間軸調整、文字修改與格式匯出。', 8],
]

for (const [name, url, desc, sort] of items) {
  const r = await execSQL('INSERT INTO items (name, url, description, sort_order) VALUES (?, ?, ?, ?)', [name, url, desc, sort])
  console.log(`  插入項目: ${name} - success: ${r.success}`)
}

// 查詢項目
const itemResult = await execSQL('SELECT * FROM items')
console.log('項目查詢結果:', JSON.stringify(itemResult.result?.[0]?.results, null, 2))
