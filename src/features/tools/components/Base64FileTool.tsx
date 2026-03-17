import { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video, 
  File,
  Trash2,
  RefreshCw,
  AlertCircle,
  Scissors,
  Maximize2
} from 'lucide-react';
import { useClipboard } from '../../../hooks/useLocalStorage';
import { AdFooter } from '../../../components/ads';
import { CodeEditor } from '../../../components/CodeEditor';
import { ToolInfoAuto } from './ToolInfoSection';
import { ToolHeader } from '../../../components/common';

interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export function Base64FileTool() {
  const [activeTab, setActiveTab] = useState<'file-to-base64' | 'base64-to-file'>('file-to-base64');
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [base64Content, setBase64Content] = useState('');
  const [, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [outputFileName, setOutputFileName] = useState('');
  const [outputFileType, setOutputFileType] = useState('application/octet-stream');
  const [truncated, setTruncated] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { copied, copy } = useClipboard();

  const MAX_DISPLAY_LENGTH = 5000; // 最大显示字符数

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取文件图标
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />;
    if (type.startsWith('audio/')) return <Music className="w-6 h-6 text-amber-500" />;
    if (type.startsWith('video/')) return <Video className="w-6 h-6 text-rose-500" />;
    if (type.startsWith('text/')) return <FileText className="w-6 h-6 text-blue-500" />;
    return <File className="w-6 h-6 text-surface-500" />;
  };

  // 文件转 Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // 移除 data:xxx;base64, 前缀
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 处理文件选择
  const handleFileSelect = useCallback(async (file: File) => {
    setError('');
    setIsProcessing(true);
    
    try {
      const base64 = await fileToBase64(file);
      setFileInfo({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      });
      
      // 如果内容太长，只显示部分
      if (base64.length > MAX_DISPLAY_LENGTH) {
        setBase64Content(base64);
        setTruncated(true);
      } else {
        setBase64Content(base64);
        setTruncated(false);
      }
    } catch {
      setError('文件转换失败');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // 处理文件输入变化
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 拖拽处理
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 复制 Base64
  const handleCopyBase64 = () => {
    if (base64Content) {
      copy(base64Content);
    }
  };

  // 下载 Base64 为文本文件
  const downloadBase64AsText = () => {
    if (!base64Content) return;
    const blob = new Blob([base64Content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileInfo ? `${fileInfo.name}.base64.txt` : 'file.base64.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 清空
  const clearFile = () => {
    setFileInfo(null);
    setBase64Content('');
    setError('');
    setTruncated(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Base64 转文件
  const handleBase64ToFile = () => {
    setError('');
    
    if (!base64Content.trim()) {
      setError('请输入 Base64 内容');
      return;
    }
    
    if (!outputFileName) {
      setError('请输入输出文件名');
      return;
    }

    try {
      // 清理 Base64 字符串（移除空白字符）
      const cleanBase64 = base64Content.replace(/\s/g, '');
      
      // 解码 Base64
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: outputFileType });
      
      // 下载文件
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = outputFileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Base64 解码失败，请检查输入内容');
    }
  };

  // 检测 Base64 对应的文件类型
  const detectFileType = (base64: string): string => {
    // 简单的文件签名检测
    const signatures: Record<string, string> = {
      '/9j/': 'image/jpeg',
      'iVBORw0KGgo': 'image/png',
      'R0lGOD': 'image/gif',
      'Qk02': 'image/bmp',
      'UEsDBBQ': 'application/zip',
      'JVBERi0': 'application/pdf',
    };
    
    for (const [sig, type] of Object.entries(signatures)) {
      if (base64.startsWith(sig)) {
        return type;
      }
    }
    
    return 'application/octet-stream';
  };

  // 尝试预览图片
  const tryGetPreview = (): string | null => {
    if (!base64Content || activeTab !== 'file-to-base64') return null;
    if (fileInfo?.type.startsWith('image/')) {
      return `data:${fileInfo.type};base64,${base64Content}`;
    }
    return null;
  };

  const preview = tryGetPreview();

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* 标题 */}
      <ToolHeader
        title="Base64 文件转换"
        description="文件与 Base64 编码之间相互转换，支持图片预览和下载"
      />

      {/* Tab 切换 */}
      <div className="flex gap-1 border-b border-surface-200 dark:border-surface-700 mb-4 sm:mb-5">
        <button
          onClick={() => {
            setActiveTab('file-to-base64');
            clearFile();
          }}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 -mb-px ${
            activeTab === 'file-to-base64'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
          }`}
        >
          <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4" />
          文件转 Base64
        </button>
        <button
          onClick={() => {
            setActiveTab('base64-to-file');
            clearFile();
          }}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 -mb-px ${
            activeTab === 'base64-to-file'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
          }`}
        >
          <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4" />
          Base64 转文件
        </button>
      </div>

      {/* 文件转 Base64 */}
      {activeTab === 'file-to-base64' && (
        <div className="space-y-5">
          {/* 上传区域 */}
          {!fileInfo && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-surface-300 dark:border-surface-700 hover:border-surface-400 dark:hover:border-surface-600'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="base64-file-input"
                name="base64-file-input"
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-surface-100 dark:bg-surface-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-surface-400" />
              </div>
              <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
                点击或拖拽文件到此处
              </h3>
              <p className="text-sm text-surface-500">
                支持任意文件类型，文件大小建议不超过 10MB
              </p>
            </div>
          )}

          {/* 文件信息 */}
          {fileInfo && (
            <div className="card p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-12 h-12 bg-surface-100 dark:bg-surface-800 rounded-xl flex items-center justify-center">
                    {getFileIcon(fileInfo.type)}
                  </div>
                  <div>
                    <h3 className="font-medium text-surface-900 dark:text-surface-100">{fileInfo.name}</h3>
                    <p className="text-sm text-surface-500">
                      {formatFileSize(fileInfo.size)} · {fileInfo.type || '未知类型'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  className="btn-ghost-danger btn-icon"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* 图片预览 */}
              {preview && (
                <div className="p-4 bg-surface-50 dark:bg-surface-900/50 rounded-xl">
                  <p className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">图片预览</p>
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-64 max-w-full rounded-lg"
                  />
                </div>
              )}

              {/* Base64 输出 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    Base64 编码
                    {truncated && !showFullContent && (
                      <span className="ml-2 text-xs text-amber-600">
                        (内容已截断，点击展开显示全部)
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyBase64}
                      className={`btn-tool ${copied ? 'btn-ghost-success' : 'btn-secondary'}`}
                    >
                      {copied ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
                      {copied ? '已复制' : '复制'}
                    </button>
                    <button
                      onClick={downloadBase64AsText}
                      className="btn-secondary btn-tool"
                    >
                      <Download className="w-3.5 h-3.5 flex-shrink-0" />
                      下载
                    </button>
                    {truncated && (
                      <button
                        onClick={() => setShowFullContent(!showFullContent)}
                        className="btn-ghost btn-tool"
                      >
                        {showFullContent ? <Scissors className="w-3.5 h-3.5 flex-shrink-0" /> : <Maximize2 className="w-3.5 h-3.5 flex-shrink-0" />}
                        {showFullContent ? '收起' : '展开'}
                      </button>
                    )}
                  </div>
                </div>
                <CodeEditor
                  value={showFullContent ? base64Content : base64Content.slice(0, MAX_DISPLAY_LENGTH)}
                  onChange={() => {}}
                  language="text"
                  height={192}
                  readOnly
                  variant="embedded"
                />
                {truncated && !showFullContent && (
                  <p className="text-xs text-surface-500">
                    显示前 {MAX_DISPLAY_LENGTH} 字符，共 {base64Content.length} 字符
                  </p>
                )}
              </div>

              {/* 快捷操作 */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-surface-500 mr-2">快捷操作:</span>
                <button
                  onClick={() => setActiveTab('base64-to-file')}
                  className="btn-primary btn-tool"
                >
                  用此 Base64 解码
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Base64 转文件 */}
      {activeTab === 'base64-to-file' && (
        <div className="space-y-5">
          <div className="card p-4 sm:p-6 space-y-4">
            {/* Base64 输入 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                Base64 编码内容
              </label>
              <CodeEditor
                value={base64Content}
                onChange={(value) => {
                  setBase64Content(value);
                  // 尝试自动检测文件类型
                  const detected = detectFileType(value.trim());
                  if (detected !== 'application/octet-stream') {
                    setOutputFileType(detected);
                  }
                }}
                language="text"
                height={192}
                placeholder="在此处粘贴 Base64 编码..."
                variant="embedded"
              />
            </div>

            {/* 输出设置 */}
            <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <label htmlFor="base64-output-filename" className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  输出文件名
                </label>
                <input
                  type="text"
                  id="base64-output-filename"
                  name="base64-output-filename"
                  value={outputFileName}
                  onChange={(e) => setOutputFileName(e.target.value)}
                  placeholder="例如: file.pdf"
                  className="w-full input"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="base64-output-type" className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  MIME 类型
                </label>
                <select
                  id="base64-output-type"
                  name="base64-output-type"
                  value={outputFileType}
                  onChange={(e) => setOutputFileType(e.target.value)}
                  className="w-full select"
                >
                  <option value="application/octet-stream">自动检测 / 二进制流</option>
                  <option value="image/jpeg">图片 (JPEG)</option>
                  <option value="image/png">图片 (PNG)</option>
                  <option value="image/gif">图片 (GIF)</option>
                  <option value="application/pdf">PDF 文档</option>
                  <option value="text/plain">文本文件</option>
                  <option value="application/zip">ZIP 压缩包</option>
                  <option value="application/json">JSON</option>
                </select>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4" />
                {error}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleBase64ToFile}
                disabled={!base64Content.trim() || !outputFileName}
                className="btn-primary btn-action flex-1"
              >
                <Download className="w-4 h-4 flex-shrink-0" />
                解码并下载文件
              </button>
              <button
                onClick={clearFile}
                className="btn-ghost btn-tool"
              >
                <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
                清空
              </button>
            </div>

            {/* 使用提示 */}
            <div className="p-4 bg-surface-50 dark:bg-surface-900/50 rounded-xl space-y-2">
              <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300">使用提示</h4>
              <ul className="text-sm text-surface-500 space-y-1 list-disc list-inside">
                <li>Base64 内容会自动清理空白字符</li>
                <li>如果包含 data:xxx;base64, 前缀，系统会自动去除</li>
                <li>大文件转换可能需要一些时间，请耐心等待</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <ToolInfoAuto toolId="base64-file" />

      <AdFooter />
    </div>
  );
}
