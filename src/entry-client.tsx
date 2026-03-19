import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './style.css'

const rootElement = document.getElementById('root')!
const loaderElement = document.getElementById('loader')

// 水合完成后显示内容
function onHydrated() {
  // 先给 root 添加 hydrated 类显示内容
  rootElement.classList.add('hydrated')
  
  // 短暂延迟后移除加载遮罩（让内容先渲染）
  setTimeout(() => {
    if (loaderElement) {
      loaderElement.classList.add('hidden')
      setTimeout(() => loaderElement.remove(), 150)
    }
  }, 50)
}

// 开始水合
hydrateRoot(
  rootElement,
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// 使用 requestIdleCallback 或 setTimeout 确保水合完成后才显示
if ('requestIdleCallback' in window) {
  requestIdleCallback(onHydrated, { timeout: 500 })
} else {
  setTimeout(onHydrated, 100)
}
