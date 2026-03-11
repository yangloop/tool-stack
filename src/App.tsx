import { BrowserRouter, Routes, Route, useParams, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { tools } from './data/tools';

// 工具页面组件
function ToolPage() {
  const { toolId } = useParams<{ toolId: string }>();
  const tool = tools.find(t => t.id === toolId);
  
  useEffect(() => {
    if (tool) {
      document.title = `${tool.name} - ToolStack`;
    }
  }, [tool]);
  
  if (!tool) {
    return <Navigate to="/" replace />;
  }
  
  const ToolComponent = tool.component;
  
  return (
    <Layout activeToolId={tool.id}>
      <ToolComponent />
    </Layout>
  );
}

// 首页组件
function HomePage() {
  useEffect(() => {
    document.title = 'ToolStack - 开发者工具箱';
  }, []);
  
  return (
    <Layout activeToolId="">
      <Home onToolSelect={(id) => {
        window.location.href = `/tool/${id}`;
      }} />
    </Layout>
  );
}

// 滚动到顶部组件
function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tool/:toolId" element={<ToolPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
