import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { tools } from './data/tools';
import { SEO, getToolSEO } from './components/SEO';

function App() {
  const [activeToolId, setActiveToolId] = useState<string>('');
  const [, setSearchQuery] = useState('');

  const activeTool = tools.find(t => t.id === activeToolId);

  // 获取 SEO 配置
  const seoConfig = activeTool 
    ? getToolSEO(activeTool.id, activeTool.name)
    : {
        title: '',
        description: '',
        keywords: '',
        pathname: '/'
      };

  // 更新页面 SEO
  useEffect(() => {
    if (activeTool) {
      document.title = `${activeTool.name} - ToolStack`;
    } else {
      document.title = 'ToolStack - 开发者工具箱';
    }
  }, [activeTool]);

  return (
    <>
      <SEO 
        title={seoConfig.title}
        description={seoConfig.description}
        keywords={seoConfig.keywords}
        pathname={seoConfig.pathname}
      />
      <Layout 
        activeToolId={activeToolId} 
        onToolSelect={setActiveToolId}
        onSearch={setSearchQuery}
      >
        {activeTool ? (
          <activeTool.component />
        ) : (
          <Home onToolSelect={setActiveToolId} />
        )}
      </Layout>
    </>
  );
}

export default App;
