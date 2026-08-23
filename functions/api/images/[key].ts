/// <reference types="@cloudflare/workers-types" />

import type { EventHandler } from 'hono'

export const onRequest: EventHandler = async (c) => {
  const bucket = c.env.IMAGES as R2Bucket
  const key = c.req.param('key')
  const object = await bucket.get(key)

  if (!object) {
    return new Response('Not Found', { status: 404 })
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)

  return new Response(object.body, { headers })
}
