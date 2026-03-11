import { useState } from 'react';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { tools } from './data/tools';


function App() {
  const [activeToolId, setActiveToolId] = useState<string>('');
  const [, setSearchQuery] = useState('');

  const activeTool = tools.find(t => t.id === activeToolId);

  return (
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
  );
}

export default App;
