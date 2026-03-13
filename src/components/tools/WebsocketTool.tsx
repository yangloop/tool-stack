import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Send, 
  Trash2, 
  Copy, 
  Check, 
  Clock, 
  MessageSquare, 
  Settings,
  ChevronDown,
  ChevronUp,
  Download,
  Play,
  Square,
  AlertCircle,
  Code,
  Type
} from 'lucide-react';
import { useClipboard } from '../../hooks/useLocalStorage';
import { AdFooter } from '../ads';
import { ToolInfoAuto } from './ToolInfoSection';
import { CodeEditor } from '../CodeEditor';

interface Message {
  id: string;
  type: 'sent' | 'received' | 'system';
  content: string;
  timestamp: Date;
  isJson?: boolean;
}

interface ConnectionStats {
  connectedAt?: Date;
  messagesSent: number;
  messagesReceived: number;
  bytesSent: number;
  bytesReceived: number;
}

export function WebsocketTool() {
  const [url, setUrl] = useState('wss://echo.websocket.org/');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [messageFormat, setMessageFormat] = useState<'text' | 'json'>('text');
  const [showSettings, setShowSettings] = useState(false);
  const [autoReconnect, setAutoReconnect] = useState(false);
  const [reconnectInterval, setReconnectInterval] = useState(3000);
  const [heartbeatEnabled, setHeartbeatEnabled] = useState(false);
  const [heartbeatInterval, setHeartbeatInterval] = useState(30000);
  const [heartbeatMessage, setHeartbeatMessage] = useState('ping');
  const [jsonTemplate, setJsonTemplate] = useState('{\n  "type": "message",\n  "content": "Hello"\n}');
  
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { copied, copy } = useClipboard();
  
  const [stats, setStats] = useState<ConnectionStats>({
    messagesSent: 0,
    messagesReceived: 0,
    bytesSent: 0,
    bytesReceived: 0,
  });

  // 自动滚动到底部（仅在消息列表容器内滚动，不影响页面）
  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      wsRef.current?.close();
    };
  }, []);

  // 心跳设置变化时，如果已连接则重新启动心跳
  useEffect(() => {
    if (connectionStatus === 'connected') {
      startHeartbeat();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heartbeatEnabled, heartbeatInterval, heartbeatMessage]);

  const addMessage = useCallback((type: Message['type'], content: string, isJson = false) => {
    const message: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date(),
      isJson,
    };
    setMessages((prev) => [...prev, message]);
    
    // 更新统计
    if (type === 'sent') {
      setStats((prev) => ({
        ...prev,
        messagesSent: prev.messagesSent + 1,
        bytesSent: prev.bytesSent + new Blob([content]).size,
      }));
    } else if (type === 'received') {
      setStats((prev) => ({
        ...prev,
        messagesReceived: prev.messagesReceived + 1,
        bytesReceived: prev.bytesReceived + new Blob([content]).size,
      }));
    }
  }, []);

  // 启动心跳 - 直接检查 WebSocket 状态而不是依赖 connectionStatus
  const startHeartbeat = useCallback(() => {
    // 先清除旧的心跳定时器
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    
    if (!heartbeatEnabled) return;
    
    // 立即发送第一次心跳
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(heartbeatMessage);
      addMessage('sent', `[心跳] ${heartbeatMessage}`);
    }
    
    // 设置定时心跳
    heartbeatTimerRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(heartbeatMessage);
        addMessage('sent', `[心跳] ${heartbeatMessage}`);
      }
    }, heartbeatInterval);
  }, [heartbeatEnabled, heartbeatInterval, heartbeatMessage, addMessage]);

  const connect = useCallback(() => {
    if (!url) return;
    
    // 关闭现有连接
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    setConnectionStatus('connecting');
    addMessage('system', `正在连接到 ${url}...`);
    
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      
      ws.onopen = () => {
        setConnectionStatus('connected');
        setStats((prev) => ({ ...prev, connectedAt: new Date() }));
        addMessage('system', '连接已建立');
        startHeartbeat();
      };
      
      ws.onmessage = (event) => {
        const content = event.data;
        let isJson = false;
        try {
          JSON.parse(content);
          isJson = true;
        } catch {
          // not JSON
        }
        addMessage('received', content, isJson);
      };
      
      ws.onclose = (event) => {
        setConnectionStatus('disconnected');
        addMessage('system', `连接已关闭 (Code: ${event.code}, Reason: ${event.reason || '无'})`);
        
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
          heartbeatTimerRef.current = null;
        }
        
        // 自动重连
        if (autoReconnect && !event.wasClean) {
          addMessage('system', `${reconnectInterval / 1000}秒后自动重连...`);
          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };
      
      ws.onerror = () => {
        setConnectionStatus('error');
        addMessage('system', '连接错误');
      };
    } catch (error) {
      setConnectionStatus('error');
      addMessage('system', `连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [url, autoReconnect, reconnectInterval, addMessage, startHeartbeat]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    wsRef.current?.close();
    wsRef.current = null;
    setConnectionStatus('disconnected');
    addMessage('system', '用户断开连接');
  }, [addMessage]);

  const sendMessage = useCallback(() => {
    if (!inputMessage.trim() || !wsRef.current) return;
    
    const messageToSend = messageFormat === 'json' 
      ? JSON.stringify(JSON.parse(inputMessage))
      : inputMessage;
    
    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(messageToSend);
      addMessage('sent', messageToSend, messageFormat === 'json');
      setInputMessage('');
    } else {
      addMessage('system', '消息发送失败: 连接未打开');
    }
  }, [inputMessage, messageFormat, addMessage]);

  const clearMessages = () => {
    setMessages([]);
    setStats({
      messagesSent: 0,
      messagesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
    });
  };

  const exportMessages = () => {
    const data = messages.map(m => ({
      type: m.type,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `websocket-messages-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const tryFormatJson = (content: string): string => {
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return content;
    }
  };

  const connectionTime = stats.connectedAt 
    ? formatDuration(Date.now() - stats.connectedAt.getTime())
    : '-';

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* 标题 */}
      <div className="tool-header">
        <div className="tool-icon">
          <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 sm:w-5 sm:h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
            WebSocket 测试
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">
            在线 WebSocket 客户端，测试和调试 WebSocket 连接
          </p>
        </div>
      </div>

      {/* 连接区域 */}
      <div className="card p-2.5 sm:p-3 sm:p-4 sm:p-6 mb-4 sm:mb-5 space-y-4">
        <div className="flex flex-wrap gap-2 sm:gap-2.5 sm:p-3">
          <div className="flex-1 min-w-[300px]">
            <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">
              WebSocket URL
            </label>
            <div className="flex gap-1.5 sm:gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="wss://example.com/socket"
                disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
                className="flex-1 input"
              />
              {connectionStatus === 'connected' ? (
                <button
                  onClick={disconnect}
                  className="btn-danger btn-tool"
                >
                  <Square className="w-4 h-4 flex-shrink-0" />
                  断开
                </button>
              ) : (
                <button
                  onClick={connect}
                  disabled={!url || connectionStatus === 'connecting'}
                  className="btn-primary btn-tool"
                >
                  {connectionStatus === 'connecting' ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 flex-shrink-0" />
                  )}
                  {connectionStatus === 'connecting' ? '连接中' : '连接'}
                </button>
              )}
            </div>
          </div>
          
          {/* 状态指示器 */}
          <div className="flex items-end">
            <div className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border flex items-center gap-2 ${
              connectionStatus === 'connected'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                : connectionStatus === 'connecting'
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                : connectionStatus === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-500'
            }`}>
              {connectionStatus === 'connected' ? (
                <>
                  <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-sm font-medium">已连接</span>
                </>
              ) : connectionStatus === 'connecting' ? (
                <>
                  <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                  <span className="text-sm font-medium">连接中</span>
                </>
              ) : connectionStatus === 'error' ? (
                <>
                  <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-sm font-medium">错误</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-sm font-medium">未连接</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 设置折叠面板 */}
        <div className="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between bg-surface-50 dark:bg-surface-900/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300 flex items-center gap-1.5 sm:gap-2">
              <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4" />
              高级设置
            </span>
            {showSettings ? <ChevronUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4" />}
          </button>
          
          {showSettings && (
            <div className="p-2.5 sm:p-3 sm:p-4 space-y-4 border-t border-surface-200 dark:border-surface-700">
              <div className="grid md:grid-cols-2 gap-2.5 sm:p-3 sm:gap-2.5 sm:p-3 sm:p-4">
                {/* 自动重连 */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoReconnect}
                      onChange={(e) => setAutoReconnect(e.target.checked)}
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-sm text-surface-700 dark:text-surface-300">自动重连</span>
                  </label>
                  {autoReconnect && (
                    <div className="flex items-center gap-2 pl-6">
                      <span className="text-sm text-surface-500">间隔</span>
                      <input
                        type="number"
                        value={reconnectInterval}
                        onChange={(e) => setReconnectInterval(Number(e.target.value))}
                        min={1000}
                        step={1000}
                        className="w-20 input py-1 text-sm"
                      />
                      <span className="text-sm text-surface-500">ms</span>
                    </div>
                  )}
                </div>

                {/* 心跳检测 */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={heartbeatEnabled}
                      onChange={(e) => setHeartbeatEnabled(e.target.checked)}
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-sm text-surface-700 dark:text-surface-300">心跳检测</span>
                  </label>
                  {heartbeatEnabled && (
                    <div className="space-y-2 pl-6">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-sm text-surface-500">间隔</span>
                        <input
                          type="number"
                          value={heartbeatInterval}
                          onChange={(e) => setHeartbeatInterval(Number(e.target.value))}
                          min={5000}
                          step={1000}
                          className="w-20 input py-1 text-sm"
                        />
                        <span className="text-sm text-surface-500">ms</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-sm text-surface-500">消息</span>
                        <input
                          type="text"
                          value={heartbeatMessage}
                          onChange={(e) => setHeartbeatMessage(e.target.value)}
                          className="flex-1 input py-1 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:p-3 mb-5">
        {[
          { label: '连接时长', value: connectionTime, icon: Clock },
          { label: '发送消息', value: stats.messagesSent, icon: Send },
          { label: '接收消息', value: stats.messagesReceived, icon: MessageSquare },
          { label: '发送数据', value: `${(stats.bytesSent / 1024).toFixed(2)} KB`, icon: Upload },
          { label: '接收数据', value: `${(stats.bytesReceived / 1024).toFixed(2)} KB`, icon: Download },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-surface-50 dark:bg-surface-900/50 p-2.5 sm:p-3 rounded-xl border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-2 text-surface-500 mb-1">
              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="text-xs">{label}</span>
            </div>
            <div className="text-lg font-semibold text-surface-900 dark:text-surface-100">{value}</div>
          </div>
        ))}
      </div>

      {/* 消息区域 */}
      <div className="grid lg:grid-cols-3 gap-2.5 sm:p-3 sm:p-4 sm:gap-5">
        {/* 发送消息 */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-2.5 sm:p-3 sm:p-4 sm:p-6 space-y-4">
            <h3 className="font-medium text-surface-900 dark:text-surface-100 flex items-center gap-1.5 sm:gap-2">
              <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 text-primary-500" />
              发送消息
            </h3>
            
            {/* 格式选择 */}
            <div className="flex gap-1.5 sm:gap-2">
              <button
                onClick={() => setMessageFormat('text')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  messageFormat === 'text'
                    ? 'bg-primary-500 text-white'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                }`}
              >
                <Type className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                文本
              </button>
              <button
                onClick={() => setMessageFormat('json')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  messageFormat === 'json'
                    ? 'bg-primary-500 text-white'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                }`}
              >
                <Code className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                JSON
              </button>
            </div>

            {/* 输入框 */}
            <CodeEditor
              value={inputMessage}
              onChange={setInputMessage}
              language={messageFormat === 'json' ? 'json' : 'text'}
              height={192}
              placeholder={messageFormat === 'json' ? '{"type": "message"}' : '输入要发送的消息...'}
              variant="embedded"
            />
            
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || connectionStatus !== 'connected'}
              className="w-full btn-primary"
            >
              <Send className="w-4 h-4 flex-shrink-0" />
              发送
            </button>

            {/* JSON 模板 */}
            {messageFormat === 'json' && (
              <div className="pt-3 border-t border-surface-200 dark:border-surface-700">
                <label className="text-xs text-surface-500 mb-1.5 block">JSON 模板</label>
                <CodeEditor
                  value={jsonTemplate}
                  onChange={setJsonTemplate}
                  language="json"
                  height={96}
                  variant="embedded"
                />
                <button
                  onClick={() => setInputMessage(jsonTemplate)}
                  className="mt-2 text-xs text-primary-600 hover:text-primary-700"
                >
                  使用模板
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 消息记录 */}
        <div className="lg:col-span-2">
          <div className="card h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-surface-900 dark:text-surface-100 flex items-center gap-1.5 sm:gap-2">
                <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 text-primary-500" />
                消息记录
                <span className="text-sm text-surface-500">({messages.length})</span>
              </h3>
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  onClick={exportMessages}
                  disabled={messages.length === 0}
                  className="btn-secondary btn-tool"
                >
                  <Download className="w-3.5 h-3.5 flex-shrink-0" />
                  导出
                </button>
                <button
                  onClick={clearMessages}
                  disabled={messages.length === 0}
                  className="btn-ghost-danger btn-tool"
                >
                  <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                  清空
                </button>
              </div>
            </div>

            {/* 消息列表 */}
            <div className="flex-1 min-h-[300px] sm:min-h-[400px] max-h-[500px] sm:max-h-[600px] overflow-y-auto bg-surface-50 dark:bg-surface-900/30 rounded-xl border border-surface-200 dark:border-surface-700 p-2.5 sm:p-3 space-y-2">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-surface-400">
                  <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">暂无消息</p>
                  <p className="text-xs mt-1">连接成功后可以发送和接收消息</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-2.5 sm:p-3 rounded-xl text-sm ${
                      message.type === 'sent'
                        ? 'bg-primary-50 dark:bg-primary-900/20 ml-8'
                        : message.type === 'received'
                        ? 'bg-surface-100 dark:bg-surface-800 mr-8'
                        : 'bg-amber-50 dark:bg-amber-900/20 text-center'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {message.type === 'sent' ? (
                          <>
                            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 sm:w-5 sm:h-5 rounded-full bg-primary-500 flex items-center justify-center">
                              <Send className="w-2.5 h-2.5 text-white" />
                            </span>
                            <span className="text-xs font-medium text-primary-600 dark:text-primary-400">发送</span>
                          </>
                        ) : message.type === 'received' ? (
                          <>
                            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 sm:w-5 sm:h-5 rounded-full bg-surface-400 flex items-center justify-center">
                              <MessageSquare className="w-2.5 h-2.5 text-white" />
                            </span>
                            <span className="text-xs font-medium text-surface-600 dark:text-surface-400">接收</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">系统</span>
                          </>
                        )}
                        {message.isJson && (
                          <span className="badge-primary text-[10px]">JSON</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-xs text-surface-400">{formatTime(message.timestamp)}</span>
                        {message.type !== 'system' && (
                          <button
                            onClick={() => copy(message.content)}
                            className="text-surface-400 hover:text-surface-600"
                          >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>
                    <pre className={`whitespace-pre-wrap break-all font-mono text-xs overflow-x-auto ${
                      message.type === 'system' ? 'text-surface-600 dark:text-surface-400' : ''
                    }`}>
                      {message.isJson ? tryFormatJson(message.content) : message.content}
                    </pre>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>



      {/* 功能说明 */}
      <ToolInfoAuto toolId="websocket" />

      <AdFooter />
    </div>
  );
}

// Upload icon component
function Upload({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}
