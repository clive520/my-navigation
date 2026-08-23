// 使用 wrangler D1 API 直接寫入資料（UTF-8 安全）
import { execSync } from 'child_process'

const DB_NAME = 'my-navigation-db'

function run(cmd) {
  const result = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
  // wrangler 輸出包含非 JSON 文字，需要找到 JSON 陣列
  const match = result.match(/\[[\s\S]*\]/)
  if (match) return JSON.parse(match[0])
  return {}
}

function sql(command) {
  const escaped = command.replace(/"/g, '\\"')
  return run(`wrangler d1 execute ${DB_NAME} --remote --command "${escaped}"`)
}

// 清除舊資料
console.log('清除舊資料...')
sql('DELETE FROM item_tags')
sql('DELETE FROM items')
sql('DELETE FROM tags')

// 插入標籤
console.log('插入標籤...')
const tagNames = ['工具', '學習', '娛樂', '開發', '設計', '商業', 'AI', '其他']
for (const name of tagNames) {
  sql(`INSERT INTO tags (name) VALUES ('${name}')`)
}
console.log('標籤插入完成')

// 插入項目
console.log('插入項目...')
const items = [
  { name: 'GitHub', url: 'https://github.com', description: '程式碼版本控制平台', sort_order: 1, tag_id: 4 },
  { name: 'YouTube', url: 'https://youtube.com', description: '影片分享平台', sort_order: 2, tag_id: 3 },
  { name: 'Notion', url: 'https://notion.so', description: '線上筆記與知識管理', sort_order: 3, tag_id: 1 },
  { name: 'Figma', url: 'https://figma.com', description: 'UI 設計工具', sort_order: 4, tag_id: 5 },
  { name: 'ChatGPT', url: 'https://chat.openai.com', description: 'AI 對話助手', sort_order: 5, tag_id: 7 },
  { name: 'Udemy', url: 'https://udemy.com', description: '線上課程平台', sort_order: 6, tag_id: 2 },
  { name: 'Stripe', url: 'https://stripe.com', description: '線上金流服務', sort_order: 7, tag_id: 6 },
  { name: '字幕工坊 SRT Studio', url: 'https://srt-studio-iota.vercel.app/', description: '線上 SRT 字幕編輯工具，可直接在瀏覽器中編輯字幕檔案，支援時間軸調整、文字修改與格式匯出。', sort_order: 8, tag_id: 1 },
]

for (const item of items) {
  const result = sql(`INSERT INTO items (name, url, description, sort_order) VALUES ('${item.name}', '${item.url}', '${item.description}', ${item.sort_order})`)
  const itemId = result.meta?.last_row_id
  if (itemId) {
    sql(`INSERT INTO item_tags (item_id, tag_id) VALUES (${itemId}, ${item.tag_id})`)
  }
}

console.log('全部完成！')
