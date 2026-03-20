import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import express, { type Request, type Response, type NextFunction } from 'express'

const isProduction = process.env.NODE_ENV === 'production'
const DOMAIN = process.env.DOMAIN || 'https://toolstack.juvvv.com'
const rootDir = process.cwd()

async function createServer() {
  const app = express()

  let vite: any

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite')
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    })
    app.use(vite.middlewares)
  } else {
    const clientDistDir = path.resolve(rootDir, 'dist/client')

    app.use(
      '/assets',
      express.static(path.join(clientDistDir, 'assets'), {
        fallthrough: false,
        immutable: true,
        maxAge: '1y',
      }),
    )

    app.use(
      express.static(clientDistDir, {
        index: 'index.html',
        setHeaders(res, filePath) {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
            return
          }

          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
          }
        },
      }),
    )
  }

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' })
  })

  app.use('*', async (req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl
    const pathname = req.path

    try {
      if (isProduction && path.extname(pathname)) {
        res.status(404).end('Not Found')
        return
      }

      let template: string
      let render: (url: string) => { html: string }

      if (!isProduction) {
        template = fs.readFileSync(path.resolve(rootDir, 'index.html'), 'utf-8')
        render = (await vite.ssrLoadModule('/src/entry-server.tsx')).render
      } else {
        template = fs.readFileSync(path.resolve(rootDir, 'dist/client/index.html'), 'utf-8')
        const serverEntryUrl = pathToFileURL(path.resolve(rootDir, 'dist/server/entry-server.js')).href
        render = (await import(serverEntryUrl)).render
      }

      const { html: appHtml } = render(url)
      
      // 生成 canonical URL
      const canonicalUrl = `${DOMAIN}${url === '/' ? '/' : url.split('?')[0]}`
      const canonicalTag = `<link rel="canonical" href="${canonicalUrl}">`
      
      // 注入 SSR 内容和 canonical 标签
      let finalHtml = template
        .replace('<!-- CANONICAL_PLACEHOLDER -->', canonicalTag)
        .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)

      res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml)
    } catch (e) {
      if (!isProduction && vite) {
        vite.ssrFixStacktrace(e as Error)
      }
      next(e)
    }
  })

  return { app }
}

createServer().then(({ app }) => {
  const port = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`🚀 SSR Server running at http://localhost:${port}`)
  })
})
