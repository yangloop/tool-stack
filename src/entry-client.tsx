import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './style.css'

const loaderElement = document.getElementById('loader')

// 水合完成后移除加载遮罩
function hideLoader() {
  if (loaderElement) {
    loaderElement.classList.add('hidden')
    setTimeout(() => loaderElement.remove(), 200)
  }
}

// 开始水合
hydrateRoot(
  document.getElementById('root')!,
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// 立即隐藏加载器（SSR内容已经可见）
hideLoader()
