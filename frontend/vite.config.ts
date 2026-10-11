import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import { createClient } from '@supabase/supabase-js'
import {
  handleAIChat,
  handleAIGenerateListing,
  handleAIAuditListing,
  handleAIRecommendBundles,
} from './server-ai.js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hfbkrgitryajjwttyrbz.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmYmtyZ2l0cnlhamp3dHR5cmJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTU4MzcwMCwiZXhwIjoyMTA3MTU5NzAwfQ.f0PTwsjSxNajTCsQd57Ur8zkyCKbx5FyX1swlokJFq4'

export default defineConfig({
  envDir: '..',
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(SUPABASE_URL),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(SERVICE_KEY),
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  plugins: [
    {
      name: 'api-server-routes',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          // Helper to parse JSON body
          const readJsonBody = (): Promise<any> =>
            new Promise((resolve, reject) => {
              let body = ''
              req.on('data', (chunk) => {
                body += chunk
              })
              req.on('end', () => {
                try {
                  resolve(body ? JSON.parse(body) : {})
                } catch (e) {
                  reject(e)
                }
              })
              req.on('error', reject)
            })

          if (req.url === '/api/signup' && req.method === 'POST') {
            res.setHeader('Content-Type', 'application/json')
            try {
              const { email, password } = await readJsonBody()
              const sbAdmin = createClient(SUPABASE_URL, SERVICE_KEY)
              const { data, error } = await sbAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
              })
              if (error && !error.message.toLowerCase().includes('already')) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: error.message }))
              } else {
                res.end(JSON.stringify({ ok: true, user: data?.user }))
              }
            } catch (e: any) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: e.message }))
            }
            return
          }

          if (req.url === '/api/ai/chat' && req.method === 'POST') {
            res.setHeader('Content-Type', 'application/json')
            try {
              const body = await readJsonBody()
              const result = await handleAIChat(body)
              res.end(JSON.stringify(result))
            } catch (e: any) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: e.message || 'Chat generation failed' }))
            }
            return
          }

          if (req.url === '/api/ai/generate-listing' && req.method === 'POST') {
            res.setHeader('Content-Type', 'application/json')
            try {
              const body = await readJsonBody()
              const result = await handleAIGenerateListing(body)
              res.end(JSON.stringify(result))
            } catch (e: any) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: e.message || 'Listing generation failed' }))
            }
            return
          }

          if (req.url === '/api/ai/audit-listing' && req.method === 'POST') {
            res.setHeader('Content-Type', 'application/json')
            try {
              const body = await readJsonBody()
              const result = await handleAIAuditListing(body)
              res.end(JSON.stringify(result))
            } catch (e: any) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: e.message || 'Listing audit failed' }))
            }
            return
          }

          if (req.url === '/api/ai/recommend-bundles' && req.method === 'POST') {
            res.setHeader('Content-Type', 'application/json')
            try {
              const body = await readJsonBody()
              const result = await handleAIRecommendBundles(body)
              res.end(JSON.stringify(result))
            } catch (e: any) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: e.message || 'Bundle recommendation failed' }))
            }
            return
          }

          next()
        })
      },
    },
    react(),

    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Vessli',
        short_name: 'Vessli',
        description: 'Marketplace for digital products',
        theme_color: '#FAF8F5',
        background_color: '#FAF8F5',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
    }),
  ],
})
