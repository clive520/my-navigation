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

app.post('/api/upload', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || authHeader !== `Bearer ${c.env.ADMIN_PASSWORD}`) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const bucket = c.env.IMAGES
  const body = await c.req.parseBody()
  const file = body['file'] as File

  if (!file) {
    return json({ error: 'No file provided' }, 400)
  }

  const fileName = `${Date.now()}-${file.name}`
  await bucket.put(fileName, file)

  return json({ url: `/api/images/${fileName}` })
})

export const onRequest = handle(app)
