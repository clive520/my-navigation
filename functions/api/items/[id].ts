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

app.put('/api/items/:id', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || authHeader !== `Bearer ${c.env.ADMIN_PASSWORD}`) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const db = c.env.DB
  const id = c.req.param('id')
  const body = await c.req.json()
  const { name, url, description, image_url, tags } = body

  await db.prepare("UPDATE items SET name = ?, url = ?, description = ?, image_url = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(name, url, description || '', image_url || '', id).run()

  if (tags !== undefined) {
    await db.prepare('DELETE FROM item_tags WHERE item_id = ?').bind(id).run()
    for (const tagId of tags) {
      await db.prepare('INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)').bind(id, tagId).run()
    }
  }

  return json({ message: 'Item updated' })
})

app.delete('/api/items/:id', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || authHeader !== `Bearer ${c.env.ADMIN_PASSWORD}`) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const db = c.env.DB
  const id = c.req.param('id')
  await db.prepare('DELETE FROM item_tags WHERE item_id = ?').bind(id).run()
  await db.prepare('DELETE FROM items WHERE id = ?').bind(id).run()

  return json({ message: 'Item deleted' })
})

export const onRequest = handle(app)
