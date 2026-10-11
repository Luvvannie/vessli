// POST generate-cover-url { key } -> { url } (public 5-min presigned URL for vessli-covers bucket)

import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3@3.637.0'
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.637.0'

const REGION = (Deno.env.get('S3_REGION') ?? Deno.env.get('AWS_REGION') ?? 'eu-north-1').trim()
const BUCKET = Deno.env.get('S3_COVERS_BUCKET') ?? 'vessli-covers'
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const { key } = await req.json()
  if (!key) return new Response('key required', { status: 400, headers: cors })

  const s3 = new S3Client({ region: REGION })
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: 'image/*' })
  const url = await getSignedUrl(s3, command, { expiresIn: 300 })
  return Response.json({ url }, { headers: cors })
})