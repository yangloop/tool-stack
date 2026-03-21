import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { tools } from '@tools-data'
import App from './App.tsx'
import './style.css'

const rootElement = document.getElementById('root')!
const loaderElement = document.getElementById('loader')

// 水合完成后显示内容
function showContent() {
  rootElement.classList.add('loaded')
  setTimeout(() => {
    loaderElement?.classList.add('hidden')
    setTimeout(() => loaderElement?.remove(), 200)
  }, 50)
}

async function preloadCurrentRoute() {
  const match = window.location.pathname.match(/^\/tool\/([^/]+)/)
  if (!match) {
    return
  }

  const toolId = decodeURIComponent(match[1])
  const tool = tools.find((item) => item.id === toolId)
  await tool?.load?.()
}

async function bootstrap() {
  await preloadCurrentRoute()

  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
}

void bootstrap()

// 确保水合完成后显示
if ('requestIdleCallback' in window) {
  requestIdleCallback(showContent, { timeout: 300 })
} else {
  setTimeout(showContent, 100)
}
