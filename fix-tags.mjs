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

// 查詢標籤 ID
const tagResult = await execSQL('SELECT * FROM tags')
const tags = tagResult.result?.[0]?.results || []
const tagNameToId = {}
for (const t of tags) tagNameToId[t.name] = t.id
console.log('標籤:', tagNameToId)

// 查詢項目 ID
const itemResult = await execSQL('SELECT * FROM items ORDER BY sort_order')
const items = itemResult.result?.[0]?.results || []
const itemNameToId = {}
for (const i of items) itemNameToId[i.name] = i.id
console.log('項目:', itemNameToId)

// 項目-標籤對應
const itemTagMap = {
  'GitHub': '開發',
  'YouTube': '娛樂',
  'Notion': '工具',
  'Figma': '設計',
  'ChatGPT': 'AI',
  'Udemy': '學習',
  'Stripe': '商業',
  '字幕工坊 SRT Studio': '工具',
}

// 清除舊關聯
await execSQL('DELETE FROM item_tags')

// 插入關聯
for (const [itemName, tagName] of Object.entries(itemTagMap)) {
  const itemId = itemNameToId[itemName]
  const tagId = tagNameToId[tagName]
  if (itemId && tagId) {
    const r = await execSQL('INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)', [itemId, tagId])
    console.log(`  ${itemName} -> ${tagName}: ${r.success}`)
  }
}

// 驗證
const verifyResult = await execSQL(`
  SELECT i.name, GROUP_CONCAT(t.name) as tags
  FROM items i
  LEFT JOIN item_tags it ON i.id = it.item_id
  LEFT JOIN tags t ON it.tag_id = t.id
  GROUP BY i.id
  ORDER BY i.sort_order
`)
console.log('\n驗證:')
for (const row of verifyResult.result?.[0]?.results || []) {
  console.log(`  ${row.name} [${row.tags}]`)
}
