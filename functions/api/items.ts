/// <reference types="@cloudflare/workers-types" />

import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'

type Bindings = {
  DB: D1Database
  IMAGES: R2Bucket
  ADMIN_PASSWORD: string
}

const app = new Hono<{ Bindings: Bindings }>()

function jsonResponse(data: unknown, status = 200): Response {
  const json = JSON.stringify(data)
  const encoder = new TextEncoder()
  const body = encoder.encode(json)
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  })
}

app.get('/api/items', async (c) => {
  const db = c.env.DB

  const { results: items } = await db.prepare(`
    SELECT * FROM items ORDER BY sort_order ASC
  `).all()

  const { results: tags } = await db.prepare(`
    SELECT * FROM tags
  `).all()

  const { results: itemTags } = await db.prepare(`
    SELECT * FROM item_tags
  `).all()

  const itemsWithTags = items.map(item => ({
    ...item,
    tags: itemTags
      .filter(it => it.item_id === item.id)
      .map(it => tags.find(t => t.id === it.tag_id))
      .filter(Boolean)
  }))

  return jsonResponse(itemsWithTags)
})

app.get('/api/tags', async (c) => {
  const db = c.env.DB
  const { results } = await db.prepare('SELECT * FROM tags').all()
  return jsonResponse(results)
})

app.post('/api/items', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || authHeader !== `Bearer ${c.env.ADMIN_PASSWORD}`) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const db = c.env.DB
  const body = await c.req.json()
  const { name, url, description, image_url, tags } = body

  const { meta } = await db.prepare(`
    INSERT INTO items (name, url, description, image_url)
    VALUES (?, ?, ?, ?)
  `).bind(name, url, description || '', image_url || '').run()

  const itemId = meta.last_row_id

  if (tags && tags.length > 0) {
    for (const tagId of tags) {
      await db.prepare(`
        INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)
      `).bind(itemId, tagId).run()
    }
  }

  return jsonResponse({ id: itemId, message: 'Item created' }, 201)
})

app.put('/api/items/:id', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || authHeader !== `Bearer ${c.env.ADMIN_PASSWORD}`) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const db = c.env.DB
  const id = c.req.param('id')
  const body = await c.req.json()
  const { name, url, description, image_url, tags } = body

  await db.prepare(`
    UPDATE items SET name = ?, url = ?, description = ?, image_url = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(name, url, description || '', image_url || '', id).run()

  if (tags !== undefined) {
    await db.prepare('DELETE FROM item_tags WHERE item_id = ?').bind(id).run()
    if (tags.length > 0) {
      for (const tagId of tags) {
        await db.prepare(`
          INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)
        `).bind(id, tagId).run()
      }
    }
  }

  return jsonResponse({ message: 'Item updated' })
})

app.delete('/api/items/:id', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || authHeader !== `Bearer ${c.env.ADMIN_PASSWORD}`) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const db = c.env.DB
  const id = c.req.param('id')

  await db.prepare('DELETE FROM item_tags WHERE item_id = ?').bind(id).run()
  await db.prepare('DELETE FROM items WHERE id = ?').bind(id).run()

  return jsonResponse({ message: 'Item deleted' })
})

app.put('/api/items-sort', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || authHeader !== `Bearer ${c.env.ADMIN_PASSWORD}`) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const db = c.env.DB
  const body = await c.req.json()
  const { items } = body

  for (const item of items) {
    await db.prepare(`
      UPDATE items SET sort_order = ? WHERE id = ?
    `).bind(item.sort_order, item.id).run()
  }

  return jsonResponse({ message: 'Sort order updated' })
})

app.post('/api/upload', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || authHeader !== `Bearer ${c.env.ADMIN_PASSWORD}`) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const bucket = c.env.IMAGES
  const body = await c.req.parseBody()
  const file = body['file'] as File

  if (!file) {
    return jsonResponse({ error: 'No file provided' }, 400)
  }

  const fileName = `${Date.now()}-${file.name}`
  await bucket.put(fileName, file)

  return jsonResponse({ url: `/api/images/${fileName}` })
})

app.get('/api/images/:key', async (c) => {
  const bucket = c.env.IMAGES
  const key = c.req.param('key')
  const object = await bucket.get(key)

  if (!object) {
    return c.notFound()
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)

  return new Response(object.body, { headers })
})

export const onRequest = handle(app)
