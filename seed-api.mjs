import { readFileSync } from 'fs'
import { execSync } from 'child_process'

const config = readFileSync(`${process.env.APPDATA}/xdg.config/.wrangler/config/default.toml`, 'utf-8')
const tokenMatch = config.match(/oauth_token\s*=\s*"(.+?)"/)
const TOKEN = tokenMatch[1]
const ACCOUNT_ID = 'ca5d155a8d1dcb2a9ee6770606e12a15'
const DB_ID = '32fcda15-995a-46e5-aba6-775ebebe2796'

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json; charset=utf-8'
}

async function execSQL(sql, params = []) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`
  const body = params.length > 0 ? { sql, params } : { sql }
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  return await res.json()
}

// 查詢標籤
const tagsResult = await execSQL('SELECT * FROM tags ORDER BY id')
const tags = tagsResult.result?.[0]?.results || []
console.log('現有標籤:', tags.map(t => `${t.id}: ${t.name}`))

// 清除舊的標籤關聯
await execSQL('DELETE FROM item_tags')
await execSQL('DELETE FROM items')

// 重建標籤（確保 ID 正確）
await execSQL('DELETE FROM tags')
const tagNames = ['工具', '學習', '娛樂', '開發', '設計', '商業', 'AI', '其他']
for (const name of tagNames) {
  await execSQL('INSERT INTO tags (name) VALUES (?)', [name])
}

// 重新查詢標籤 ID
const newTagsResult = await execSQL('SELECT * FROM tags ORDER BY id')
const newTags = newTagsResult.result?.[0]?.results || []
console.log('新標籤:', newTags.map(t => `${t.id}: ${t.name}`))

// 建立名稱到 ID 的對照
const tagNameToId = {}
for (const tag of newTags) {
  tagNameToId[tag.name] = tag.id
}
console.log('標籤對照:', tagNameToId)

// 插入項目
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
  const result = await execSQL(
    'INSERT INTO items (name, url, description, sort_order) VALUES (?, ?, ?, ?)',
    [item.name, item.url, item.description, item.sort_order]
  )
  const itemId = result.result?.[0]?.meta?.last_row_id
  const tagId = tagNameToId[item.tag]
  if (itemId && tagId) {
    await execSQL('INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)', [itemId, tagId])
    console.log(`  插入: ${item.name} (ID:${itemId}) -> ${item.tag} (ID:${tagId})`)
  }
}

// 驗證
console.log('\n驗證結果:')
const verifyResult = await execSQL(`
  SELECT i.id, i.name, i.url, i.description, GROUP_CONCAT(t.name) as tags
  FROM items i
  LEFT JOIN item_tags it ON i.id = it.item_id
  LEFT JOIN tags t ON it.tag_id = t.id
  GROUP BY i.id
  ORDER BY i.sort_order
`)
for (const row of verifyResult.result?.[0]?.results || []) {
  console.log(`  ${row.id}. ${row.name} [${row.tags}] - ${row.description}`)
}

console.log('\n✅ 全部完成！')
