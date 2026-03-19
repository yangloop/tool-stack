import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express, { type Request, type Response, type NextFunction } from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'

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
    app.use(express.static(path.resolve(__dirname, 'dist/client'), { index: false }))
  }

  app.use('*', async (req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl

    try {
      let template: string
      let render: (url: string) => { html: string }

      if (!isProduction) {
        template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8')
        render = (await vite.ssrLoadModule('/src/entry-server.tsx')).render
      } else {
        template = fs.readFileSync(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8')
        render = (await import('./dist/server/entry-server.js')).render
      }

      const { html: appHtml } = render(url)
      
      // 注入 SSR 内容 - 初始隐藏，水合后显示
      const finalHtml = template.replace(
        '<div id="root"></div>',
        `<div id="root">${appHtml}</div>`
      )

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
