import { readFileSync } from 'fs'

const ACCOUNT_ID = 'ca5d155a8d1dcb2a9ee6770606e12a15'
const DB_ID = '32fcda15-995a-46e5-aba6-775ebebe2796'

const config = readFileSync(`${process.env.APPDATA}/xdg.config/.wrangler/config/default.toml`, 'utf-8')
const tokenMatch = config.match(/oauth_token\s*=\s*"(.+?)"/)
const TOKEN = tokenMatch[1]

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json; charset=utf-8'
}

async function execBatch(queries) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/batch`
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ queries })
  })
  const data = await res.json()
  if (!data.success) {
    console.log('錯誤:', JSON.stringify(data.errors, null, 2))
  }
  return data
}

console.log('測試刪除...')
const result = await execBatch([{ sql: 'DELETE FROM item_tags' }])
console.log('結果:', JSON.stringify(result, null, 2))
