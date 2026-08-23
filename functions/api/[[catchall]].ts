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

// ========== Auth ==========

app.post('/api/auth', async (c) => {
  const authHeader = c.req.header('Authorization') || ''
  const expected = `Bearer ${c.env.ADMIN_PASSWORD || ''}`
  if (authHeader !== expected) {
    return json({ error: 'unauthorized' }, 401)
  }
  return json({ ok: true })
})

// ========== Items ==========

app.get('/api/items', async (c) => {
  const db = c.env.DB
  const { results: items } = await db.prepare('SELECT * FROM items ORDER BY sort_order ASC').all()
  const { results: tags } = await db.prepare('SELECT * FROM tags').all()
  const { results: itemTags } = await db.prepare('SELECT * FROM item_tags').all()
  const { results: itemFiles } = await db.prepare('SELECT * FROM item_files').all()

  return json(items.map(item => ({
    ...item,
    tags: itemTags
      .filter((it: any) => it.item_id === item.id)
      .map((it: any) => tags.find((t: any) => t.id === it.tag_id))
      .filter(Boolean),
    files: itemFiles
      .filter((f: any) => f.item_id === item.id)
  })))
})

app.get('/api/items/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const { results: items } = await db.prepare('SELECT * FROM items WHERE id = ?').bind(id).all()
  if (!items.length) return json({ error: 'Not found' }, 404)

  const item = items[0]
  const { results: tags } = await db.prepare('SELECT * FROM tags').all()
  const { results: itemTags } = await db.prepare('SELECT * FROM item_tags WHERE item_id = ?').bind(id).all()
  const { results: files } = await db.prepare('SELECT * FROM item_files WHERE item_id = ?').bind(id).all()

  return json({
    ...item,
    tags: itemTags
      .map((it: any) => tags.find((t: any) => t.id === it.tag_id))
      .filter(Boolean),
    files
  })
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
  const { results: files } = await db.prepare('SELECT file_name FROM item_files WHERE item_id = ?').bind(id).all()
  const bucket = c.env.IMAGES
  for (const file of files) {
    await bucket.delete((file as any).file_name)
  }
  await db.prepare('DELETE FROM item_files WHERE item_id = ?').bind(id).run()
  await db.prepare('DELETE FROM item_tags WHERE item_id = ?').bind(id).run()
  await db.prepare('DELETE FROM items WHERE id = ?').bind(id).run()
  return json({ message: 'Item deleted' })
})

// ========== Tags ==========

app.get('/api/tags', async (c) => {
  const db = c.env.DB
  const { results } = await db.prepare('SELECT * FROM tags').all()
  return json(results)
})

// ========== Sort ==========

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

// ========== Image Upload (for item screenshots) ==========

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

// ========== Item Files (attachments) ==========

app.get('/api/items/:id/files', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const { results } = await db.prepare('SELECT * FROM item_files WHERE item_id = ? ORDER BY created_at DESC').bind(id).all()
  return json(results)
})

app.post('/api/items/:id/files', async (c) => {
  if (!checkAuth(c)) return json({ error: 'Unauthorized' }, 401)
  const db = c.env.DB
  const bucket = c.env.IMAGES
  const id = c.req.param('id')

  const body = await c.req.parseBody()
  const file = body['file'] as File
  if (!file) return json({ error: 'No file provided' }, 400)

  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const { results: allowed } = await db.prepare('SELECT * FROM file_types WHERE extension = ? AND enabled = 1').bind(ext).all()
  if (!allowed.length) {
    return json({ error: `File type .${ext} is not allowed` }, 400)
  }

  const storedName = `${Date.now()}-${file.name}`
  await bucket.put(storedName, file, {
    httpMetadata: { contentType: file.type }
  })

  const { meta } = await db.prepare(
    'INSERT INTO item_files (item_id, file_name, original_name, file_type, file_size) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, storedName, file.name, ext, file.size).run()

  return json({
    id: meta.last_row_id,
    file_name: storedName,
    original_name: file.name,
    file_type: ext,
    file_size: file.size
  }, 201)
})

app.delete('/api/items/:itemId/files/:fileId', async (c) => {
  if (!checkAuth(c)) return json({ error: 'Unauthorized' }, 401)
  const db = c.env.DB
  const bucket = c.env.IMAGES
  const fileId = c.req.param('fileId')

  const { results } = await db.prepare('SELECT file_name FROM item_files WHERE id = ?').bind(fileId).all()
  if (!results.length) return json({ error: 'File not found' }, 404)

  await bucket.delete((results[0] as any).file_name)
  await db.prepare('DELETE FROM item_files WHERE id = ?').bind(fileId).run()
  return json({ message: 'File deleted' })
})

// ========== File Types ==========

app.get('/api/file-types', async (c) => {
  const db = c.env.DB
  const { results } = await db.prepare('SELECT * FROM file_types ORDER BY extension').all()
  return json(results)
})

app.post('/api/file-types', async (c) => {
  if (!checkAuth(c)) return json({ error: 'Unauthorized' }, 401)
  const db = c.env.DB
  const body = await c.req.json()
  const { extension, mime_type, label } = body

  if (!extension || !mime_type || !label) {
    return json({ error: 'Missing required fields' }, 400)
  }

  const ext = extension.toLowerCase().replace('.', '')
  const { meta, success } = await db.prepare(
    'INSERT INTO file_types (extension, mime_type, label, enabled) VALUES (?, ?, ?, 1)'
  ).bind(ext, mime_type, label).run()

  if (!success) return json({ error: 'Failed to create file type' }, 500)
  return json({ id: meta.last_row_id, message: 'File type created' }, 201)
})

app.put('/api/file-types/:id', async (c) => {
  if (!checkAuth(c)) return json({ error: 'Unauthorized' }, 401)
  const db = c.env.DB
  const id = c.req.param('id')
  const body = await c.req.json()
  const { label, enabled } = body

  await db.prepare('UPDATE file_types SET label = ?, enabled = ? WHERE id = ?')
    .bind(label, enabled ? 1 : 0, id).run()

  return json({ message: 'File type updated' })
})

app.delete('/api/file-types/:id', async (c) => {
  if (!checkAuth(c)) return json({ error: 'Unauthorized' }, 401)
  const db = c.env.DB
  const id = c.req.param('id')
  await db.prepare('DELETE FROM file_types WHERE id = ?').bind(id).run()
  return json({ message: 'File type deleted' })
})

export const onRequest = handle(app)
