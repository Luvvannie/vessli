// POST generate-file-url { key } -> { url } (private 5-min presigned URL for vessli-product-files bucket)

// Verifies auth via service-role JWT before signing. Never exposes the key — URL is time-limited.

import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3@3.637.0'
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.637.0'

const URL = Deno.env.get('SUPABASE_URL')!
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const REGION = (Deno.env.get('S3_REGION') ?? Deno.env.get('AWS_REGION') ?? 'eu-north-1').trim()
const BUCKET = (Deno.env.get('S3_FILES_BUCKET') ?? 'vessli-product-files').trim()
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) return new Response('Unauthorized', { status: 401, headers: cors })
  const verify = await fetch(`${URL}/auth/v1/token/metadata`, {
    headers: { Authorization: `Bearer ${jwt}` },
  })
  if (!verify.ok) return new Response('Unauthorized', { status: 401, headers: cors })

  const { key } = await req.json()
  if (!key) return new Response('key required', { status: 400, headers: cors })

  const s3 = new S3Client({
    region: REGION,
    requestChecksumCalculation: 'when_required',
    responseChecksumValidation: 'when_required',
    credentials: {
      accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
      secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
    },
  })
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: 'application/octet-stream' })
  const url = await getSignedUrl(s3, command, { expiresIn: 300 })
  return Response.json({ url }, { headers: cors })
})