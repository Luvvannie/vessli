// S3 helper - frontend never holds AWS secrets.
// Covers are public: https://vessli-covers.s3.eu-north-1.amazonaws.com/<key>
// Files are private: ask server (Supabase Edge Function) for a 5-min presigned URL.

const REGION = import.meta.env.VITE_S3_REGION ?? 'eu-north-1'
const COVERS_BUCKET = import.meta.env.VITE_S3_COVERS_BUCKET ?? 'vessli-covers'

export function coverUrl(key: string): string {
  return `https://${COVERS_BUCKET}.s3.${REGION}.amazonaws.com/${key}`
}

// Private files: call Edge Function get-download-link with { product_id }
// Returns { url } valid for 5 minutes. Never expose S3 keys as permanent links.
export async function requestDownloadLink(productId: string, token: string): Promise<string> {
  const base = import.meta.env.VITE_SUPABASE_URL as string
  const res = await fetch(`${base}/functions/v1/get-download-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ product_id: productId }),
  })
  if (!res.ok) throw new Error('Download not allowed')
  const data = await res.json()
  return data.url as string
}
