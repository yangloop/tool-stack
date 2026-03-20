import { Routes, Route, useParams, useLocation, useNavigate } from 'react-router-dom';
import { Suspense, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { tools } from '@tools-data';

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
  const tool = useMemo(() => tools.find((item) => item.id === toolId), [toolId]);
  
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
      <Suspense fallback={<ToolPageSkeleton title={tool.name} />}>
        <ToolComponent />
      </Suspense>
    </Layout>
  );
}

// 首页组件
function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'ToolStack - 开发者在线工具箱 | JSON格式化 SQL优化 Base64编解码等25+工具';
  }, []);
  
  return (
    <Layout activeToolId="">
      <Home onToolSelect={(id) => navigate(`/tool/${id}`)} />
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

function ToolPageSkeleton({ title }: { title: string }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="card p-6">
        <div className="h-7 w-52 rounded-lg bg-surface-200 dark:bg-surface-700" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded bg-surface-100 dark:bg-surface-700/70" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card h-[320px] rounded-2xl bg-surface-50 dark:bg-surface-900/40" />
        <div className="card h-[320px] rounded-2xl bg-surface-50 dark:bg-surface-900/40" />
      </div>
      <p className="text-sm text-surface-500">正在加载 {title}...</p>
    </div>
  );
}

export default App;
