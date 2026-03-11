import { useState, useEffect, useRef, useCallback } from 'react';
import { Copy, Check, RefreshCw, Key, Download, Shield, Lock, Unlock, Sparkles, Loader2, Zap } from 'lucide-react';
import { JSEncrypt } from 'jsencrypt';
import { useClipboard } from '../../hooks/useLocalStorage';
import { downloadFile } from '../../utils/helpers';
import { AdFooter } from '../ads';

// 使用 Web Worker 生成 RSA 密钥，避免阻塞 UI
interface WorkerResult {
  publicKey: string;
  privateKey: string;
  error?: string;
}

const useRsaWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const callbackRef = useRef<((result: WorkerResult) => void) | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 创建 Worker
    const worker = new Worker(new URL('../../workers/rsaWorker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (event) => {
      const { type, progress: p, publicKey, privateKey, error } = event.data;
      
      if (type === 'progress') {
        setProgress(p);
      } else if (type === 'result') {
        setIsGenerating(false);
        setProgress(100);
        if (callbackRef.current) {
          callbackRef.current({ publicKey, privateKey, error });
          callbackRef.current = null;
        }
      }
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
    };
  }, []);

  const generateKeys = useCallback((keySize: number, onComplete: (result: WorkerResult) => void) => {
    if (!workerRef.current) return;
    
    setIsGenerating(true);
    setProgress(0);
    callbackRef.current = onComplete;
    workerRef.current.postMessage({ type: 'generate', keySize, id: Date.now() });
  }, []);

  return { generateKeys, isGenerating, progress };
};

export function RsaTool() {
  const [keySize, setKeySize] = useState<512 | 1024 | 2048 | 4096>(2048);
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [activeTab, setActiveTab] = useState<'test' | 'generate'>('test');
  
  // 加密/解密测试
  const [testText, setTestText] = useState('');
  const [encryptedText, setEncryptedText] = useState('');
  const [decryptedText, setDecryptedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { copied: copiedPub, copy: copyPub } = useClipboard();
  const { copied: copiedPri, copy: copyPri } = useClipboard();
  const { copied: copiedEnc, copy: copyEnc } = useClipboard();
  
  // Web Worker
  const { generateKeys: generateKeysWithWorker, isGenerating, progress } = useRsaWorker();

  // 页面加载时自动生成默认密钥（使用较小的 512 位密钥快速生成）
  useEffect(() => {
    generateKeysWithWorker(512, ({ publicKey: pub, privateKey: pri }) => {
      setPublicKey(pub);
      setPrivateKey(pri);
    });
  }, [generateKeysWithWorker]);

  // 生成密钥对
  const handleGenerateKeys = () => {
    generateKeysWithWorker(keySize, ({ publicKey: pub, privateKey: pri, error }) => {
      if (!error) {
        setPublicKey(pub);
        setPrivateKey(pri);
      }
    });
  };

  // 加密测试
  const handleEncrypt = () => {
    if (!testText || !publicKey) return;
    setIsProcessing(true);
    
    // 使用 setTimeout 让 UI 有时间更新
    setTimeout(() => {
      try {
        const encrypt = new JSEncrypt();
        encrypt.setPublicKey(publicKey);
        const encrypted = encrypt.encrypt(testText);
        setEncryptedText(encrypted || '');
        setDecryptedText('');
      } catch {
        setEncryptedText('加密失败');
      } finally {
        setIsProcessing(false);
      }
    }, 50);
  };

  // 解密测试
  const handleDecrypt = () => {
    if (!encryptedText || !privateKey) return;
    setIsProcessing(true);
    
    setTimeout(() => {
      try {
        const decrypt = new JSEncrypt();
        decrypt.setPrivateKey(privateKey);
        const decrypted = decrypt.decrypt(encryptedText);
        setDecryptedText(decrypted || '');
      } catch {
        setDecryptedText('解密失败');
      } finally {
        setIsProcessing(false);
      }
    }, 50);
  };

  // 下载密钥文件
  const downloadKey = (content: string, filename: string) => {
    downloadFile(content, filename, 'text/plain');
  };

  // 加载示例文本
  const loadExample = () => {
    setTestText('Hello, RSA Encryption!');
    setEncryptedText('');
    setDecryptedText('');
  };

  // 清空测试
  const clearTest = () => {
    setTestText('');
    setEncryptedText('');
    setDecryptedText('');
  };

  // 预估生成时间
  const getEstimatedTime = (size: number) => {
    if (size <= 512) return '1-2 秒';
    if (size <= 1024) return '2-5 秒';
    if (size <= 2048) return '5-15 秒';
    return '30-60 秒';
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* 标题 */}
      <div className="tool-header">
        <div className="tool-icon">
          <Key className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
            RSA 密钥对生成器
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">
            生成 RSA 公钥和私钥，支持加密/解密测试
          </p>
        </div>
      </div>

      {/* Tab 导航 */}
      <div className="flex gap-1 border-b border-surface-200 dark:border-surface-700 mb-5">
        <button
          onClick={() => setActiveTab('test')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 -mb-px ${
            activeTab === 'test'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
          }`}
        >
          <Shield className="w-4 h-4" />
          加密/解密测试
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 -mb-px ${
            activeTab === 'generate'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
          }`}
        >
          <Key className="w-4 h-4" />
          密钥管理
        </button>
      </div>

      {/* 加密/解密测试 Tab */}
      {activeTab === 'test' && (
        <div className="space-y-5">
          {/* 快速测试区 */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-surface-900 dark:text-surface-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-500" />
                加密/解密测试
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadExample}
                  className="btn-secondary text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  加载示例
                </button>
                <button
                  onClick={clearTest}
                  className="btn-ghost text-xs text-red-500 hover:text-red-600"
                  disabled={!testText && !encryptedText}
                >
                  清空
                </button>
              </div>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-4">
              {/* 原文 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300 flex items-center gap-2">
                  <span className="w-2 h-2 bg-surface-400 rounded-full" />
                  原文
                </label>
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="输入要加密的文本..."
                  className="w-full h-36 p-4 text-sm bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 rounded-xl resize-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                />
                <button
                  onClick={handleEncrypt}
                  disabled={!testText || !publicKey || isProcessing}
                  className="w-full btn-primary text-sm disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  加密
                </button>
              </div>

              {/* 密文 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary-500 rounded-full" />
                  密文 (Base64)
                </label>
                <textarea
                  value={encryptedText}
                  readOnly
                  placeholder="点击「加密」按钮生成密文..."
                  className="w-full h-36 p-4 text-sm font-mono bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 rounded-xl resize-none"
                />
                <button
                  onClick={() => copyEnc(encryptedText)}
                  disabled={!encryptedText}
                  className="w-full btn-secondary text-sm disabled:opacity-50"
                >
                  {copiedEnc ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedEnc ? '已复制' : '复制密文'}
                </button>
              </div>

              {/* 解密结果 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  解密结果
                </label>
                <textarea
                  value={decryptedText}
                  readOnly
                  placeholder="点击「解密」按钮查看结果..."
                  className={`w-full h-36 p-4 text-sm bg-surface-50 dark:bg-surface-900/50 border rounded-xl resize-none ${
                    decryptedText && decryptedText === testText 
                      ? 'border-emerald-500 focus:border-emerald-500' 
                      : 'border-surface-200 dark:border-surface-700'
                  }`}
                />
                <button
                  onClick={handleDecrypt}
                  disabled={!encryptedText || !privateKey || isProcessing}
                  className="w-full btn-primary text-sm disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                  解密
                </button>
              </div>
            </div>

            {/* 验证结果 */}
            {decryptedText && (
              <div className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
                decryptedText === testText 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
              }`}>
                {decryptedText === testText ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>解密成功！结果与原文匹配，密钥对有效</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>解密失败或结果不匹配</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 当前密钥信息 */}
          {publicKey && privateKey && (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-surface-900 dark:text-surface-100">当前使用的密钥</h4>
                <span className="badge-primary text-[10px]">{keySize} bit</span>
              </div>
              <p className="text-sm text-surface-500">
                使用「密钥管理」标签页可重新生成或导入自定义密钥
              </p>
            </div>
          )}
        </div>
      )}

      {/* 密钥管理 Tab */}
      {activeTab === 'generate' && (
        <div className="space-y-5">
          {/* 密钥生成设置 */}
          <div className="card space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-surface-400" />
                <span className="font-medium text-surface-700 dark:text-surface-300">密钥长度</span>
                <select
                  value={keySize}
                  onChange={(e) => setKeySize(Number(e.target.value) as typeof keySize)}
                  disabled={isGenerating}
                  className="select w-48"
                >
                  <option value={512}>512 bit (测试用，最快)</option>
                  <option value={1024}>1024 bit (低安全性)</option>
                  <option value={2048}>2048 bit (推荐)</option>
                  <option value={4096}>4096 bit (高安全性，较慢)</option>
                </select>
              </div>
              
              <button
                onClick={handleGenerateKeys}
                disabled={isGenerating}
                className="btn-primary disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {isGenerating ? '生成中...' : '重新生成密钥对'}
              </button>
            </div>

            {/* 生成进度 */}
            {isGenerating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-surface-600 dark:text-surface-400 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary-500" />
                    正在生成 {keySize} 位密钥...
                  </span>
                  <span className="text-surface-500">{progress}%</span>
                </div>
                <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-surface-400">
                  预计耗时: {getEstimatedTime(keySize)} · 生成过程在后台进行，可切换标签页
                </p>
              </div>
            )}

            {/* 性能提示 */}
            {!isGenerating && keySize >= 2048 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl text-sm text-amber-700 dark:text-amber-400">
                <strong>提示:</strong> {keySize} 位密钥生成需要较长时间（{getEstimatedTime(keySize)}），这是正常现象。密钥生成使用了后台线程，不会阻塞页面操作。
              </div>
            )}
          </div>

          {/* 密钥显示区域 */}
          {publicKey && privateKey && !isGenerating && (
            <div className="grid lg:grid-cols-2 gap-5">
              {/* 公钥 */}
              <div className="card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Unlock className="w-5 h-5 text-emerald-500" />
                    <span className="font-medium text-surface-900 dark:text-surface-100">公钥 (Public Key)</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyPub(publicKey)}
                      className="btn-ghost text-xs"
                    >
                      {copiedPub ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedPub ? '已复制' : '复制'}
                    </button>
                    <button
                      onClick={() => downloadKey(publicKey, `rsa_public_${keySize}.pem`)}
                      className="btn-secondary text-xs"
                    >
                      <Download className="w-3 h-3" />
                      下载
                    </button>
                  </div>
                </div>
                <textarea
                  value={publicKey}
                  readOnly
                  className="w-full h-48 p-4 font-mono text-xs bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 rounded-xl resize-none"
                />
                <p className="text-xs text-surface-500">
                  公钥可以公开分享，用于加密数据或验证签名
                </p>
              </div>

              {/* 私钥 */}
              <div className="card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-surface-900 dark:text-surface-100">私钥 (Private Key)</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyPri(privateKey)}
                      className="btn-ghost text-xs"
                    >
                      {copiedPri ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedPri ? '已复制' : '复制'}
                    </button>
                    <button
                      onClick={() => downloadKey(privateKey, `rsa_private_${keySize}.pem`)}
                      className="btn-secondary text-xs"
                    >
                      <Download className="w-3 h-3" />
                      下载
                    </button>
                  </div>
                </div>
                <textarea
                  value={privateKey}
                  readOnly
                  className="w-full h-48 p-4 font-mono text-xs bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 rounded-xl resize-none"
                />
                <p className="text-xs text-red-500">
                  <strong>警告:</strong> 私钥必须保密保存，泄露会导致安全风险！
                </p>
              </div>
            </div>
          )}

          {/* 自定义密钥输入 */}
          {!isGenerating && (
            <div className="card space-y-4">
              <h4 className="font-medium text-surface-900 dark:text-surface-100">使用自定义密钥</h4>
              <p className="text-sm text-surface-500">
                您也可以粘贴自己的公钥和私钥进行测试（密钥格式为 PEM）
              </p>
              <div className="grid lg:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2 block">自定义公钥</label>
                  <textarea
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    placeholder="-----BEGIN PUBLIC KEY-----..."
                    className="w-full h-32 p-4 font-mono text-xs bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 rounded-xl resize-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2 block">自定义私钥</label>
                  <textarea
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="-----BEGIN RSA PRIVATE KEY-----..."
                    className="w-full h-32 p-4 font-mono text-xs bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 rounded-xl resize-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
