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

function checkAuth(c: any): boolean {
  const authHeader = c.req.header('Authorization')
  return !!authHeader && authHeader === `Bearer ${c.env.ADMIN_PASSWORD}`
}

app.post('/api/auth', async (c) => {
  const authHeader = c.req.header('Authorization') || ''
  const expected = `Bearer ${c.env.ADMIN_PASSWORD || ''}`
  if (authHeader !== expected) {
    return json({ error: 'unauthorized' }, 401)
  }
  return json({ ok: true })
})

app.get('/api/items', async (c) => {
  const db = c.env.DB
  const { results: items } = await db.prepare('SELECT * FROM items ORDER BY sort_order ASC').all()
  const { results: tags } = await db.prepare('SELECT * FROM tags').all()
  const { results: itemTags } = await db.prepare('SELECT * FROM item_tags').all()

  return json(items.map(item => ({
    ...item,
    tags: itemTags
      .filter((it: any) => it.item_id === item.id)
      .map((it: any) => tags.find((t: any) => t.id === it.tag_id))
      .filter(Boolean)
  })))
})

app.post('/api/items', async (c) => {
  if (!checkAuth(c)) return json({ error: 'Unauthorized' }, 401)
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

app.put('/api/items/:id', async (c) => {
  if (!checkAuth(c)) return json({ error: 'Unauthorized' }, 401)
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
  if (!checkAuth(c)) return json({ error: 'Unauthorized' }, 401)
  const db = c.env.DB
  const id = c.req.param('id')
  await db.prepare('DELETE FROM item_tags WHERE item_id = ?').bind(id).run()
  await db.prepare('DELETE FROM items WHERE id = ?').bind(id).run()
  return json({ message: 'Item deleted' })
})

app.get('/api/tags', async (c) => {
  const db = c.env.DB
  const { results } = await db.prepare('SELECT * FROM tags').all()
  return json(results)
})

app.put('/api/items-sort', async (c) => {
  if (!checkAuth(c)) return json({ error: 'Unauthorized' }, 401)
  const db = c.env.DB
  const body = await c.req.json()
  const { items } = body
  for (const item of items) {
    await db.prepare('UPDATE items SET sort_order = ? WHERE id = ?').bind(item.sort_order, item.id).run()
  }
  return json({ message: 'Sort order updated' })
})

app.post('/api/upload', async (c) => {
  if (!checkAuth(c)) return json({ error: 'Unauthorized' }, 401)
  const bucket = c.env.IMAGES
  const body = await c.req.parseBody()
  const file = body['file'] as File
  if (!file) return json({ error: 'No file provided' }, 400)

  const fileName = `${Date.now()}-${file.name}`
  await bucket.put(fileName, file)
  return json({ url: `/api/images/${fileName}` })
})

app.get('/api/images/:key', async (c) => {
  const bucket = c.env.IMAGES
  const key = c.req.param('key')
  const object = await bucket.get(key)
  if (!object) return c.notFound()

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  return new Response(object.body, { headers })
})

export const onRequest = handle(app)
