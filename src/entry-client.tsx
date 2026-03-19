import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
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

hydrateRoot(
  rootElement,
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// 确保水合完成后显示
if ('requestIdleCallback' in window) {
  requestIdleCallback(showContent, { timeout: 300 })
} else {
  setTimeout(showContent, 100)
}
