import { Routes, Route, useParams, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { tools } from './data/tools';

// 404 页面
function NotFound() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // 客户端自动跳转到首页
    navigate('/', { replace: true });
  }, [navigate]);
  
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
        <p className="text-surface-500">页面不存在，正在跳转...</p>
      </div>
    </div>
  );
}

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
    // 不存在的工具，渲染 404 页面（客户端会跳转）
    return <NotFound />;
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
    document.title = 'ToolStack - 开发者在线工具箱 | JSON格式化 SQL优化 Base64编解码等25+工具';
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
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [pathname]);
  
  return null;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tool/:toolId" element={<ToolPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
