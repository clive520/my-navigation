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

app.put('/api/items-sort', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || authHeader !== `Bearer ${c.env.ADMIN_PASSWORD}`) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const db = c.env.DB
  const body = await c.req.json()
  const { items } = body

  for (const item of items) {
    await db.prepare('UPDATE items SET sort_order = ? WHERE id = ?').bind(item.sort_order, item.id).run()
  }

  return json({ message: 'Sort order updated' })
})

export const onRequest = handle(app)
