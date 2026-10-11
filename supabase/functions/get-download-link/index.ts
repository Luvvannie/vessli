// POST get-download-link { product_id } -> { url } (5-min S3 presigned)
// Verifies paid order for this buyer before signing. Logs download_events.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { S3Client, GetObjectCommand } from 'npm:@aws-sdk/client-s3@3.637.0'
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
  const db = createClient(URL, KEY)
  const { data: { user } } = await db.auth.getUser(jwt)
  if (!user) return new Response('Unauthorized', { status: 401, headers: cors })
  const { product_id } = await req.json()

  // Must have a paid order for this buyer covering this product
  const { data: items } = await db.from('order_items').select('order_id,orders!inner(buyer_id,status)')
    .eq('product_id', product_id)
  const paid = (items ?? []).find((i: { orders: { buyer_id: string; status: string }; order_id: string }) =>
    i.orders.buyer_id === user.id && i.orders.status === 'paid')
  if (!paid) return new Response('No verified purchase', { status: 403, headers: cors })

  const { data: file } = await db.from('product_files').select('s3_key').eq('product_id', product_id).limit(1).single()
  if (!file) return Response.json({ ok: false, reason: 'Seller has not uploaded the file to S3 yet.' }, { headers: cors })

  const s3 = new S3Client({
    region: REGION,
    // Fixes SignatureDoesNotMatch: newer SDKs sign x-amz-checksum-mode=ENABLED which S3 rejects
    requestChecksumCalculation: 'when_required',
    responseChecksumValidation: 'when_required',
    credentials: {
      accessKeyId: (Deno.env.get('AWS_ACCESS_KEY_ID') ?? '').trim(),
      secretAccessKey: (Deno.env.get('AWS_SECRET_ACCESS_KEY') ?? '').trim(),
    },
  })
  const Key = (file.s3_key as string).trim()
  const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key }), { expiresIn: 300 })
  await db.from('download_events').insert({ order_id: paid.order_id, product_id, buyer_id: user.id })
  return Response.json({ url }, { headers: cors })
})
