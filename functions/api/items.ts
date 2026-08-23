/// <reference types="@cloudflare/workers-types" />

import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'

type Bindings = {
  DB: D1Database
  IMAGES: R2Bucket
  ADMIN_PASSWORD: string
}

const app = new Hono<{ Bindings: Bindings }>()

function json(data: unknown, status = 200): Response {
  const encoder = new TextEncoder()
  return new Response(encoder.encode(JSON.stringify(data)), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  })
}

app.get('/api/items', async (c) => {
  const db = c.env.DB
  const { results: items } = await db.prepare('SELECT * FROM items ORDER BY sort_order ASC').all()
  const { results: tags } = await db.prepare('SELECT * FROM tags').all()
  const { results: itemTags } = await db.prepare('SELECT * FROM item_tags').all()

  return json(items.map(item => ({
    ...item,
    tags: itemTags
      .filter(it => it.item_id === item.id)
      .map(it => tags.find(t => t.id === it.tag_id))
      .filter(Boolean)
  })))
})

app.post('/api/items', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || authHeader !== `Bearer ${c.env.ADMIN_PASSWORD}`) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const db = c.env.DB
  const body = await c.req.json()
  const { name, url, description, image_url, tags } = body

  const { meta } = await db.prepare('INSERT INTO items (name, url, description, image_url) VALUES (?, ?, ?, ?)')
    .bind(name, url, description || '', image_url || '').run()

  const itemId = meta.last_row_id

  if (tags && tags.length > 0) {
    for (const tagId of tags) {
      await db.prepare('INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)').bind(itemId, tagId).run()
    }
  }

  return json({ id: itemId, message: 'Item created' }, 201)
})

export const onRequest = handle(app)
