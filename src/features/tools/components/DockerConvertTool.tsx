import { useState, useCallback } from 'react';
import { 
  Copy, 
  Check, 
  ArrowRightLeft,
  Terminal,
  Trash2,
  Download,
  AlertCircle,
  FileJson,
  Settings,
  Plus,
  X,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { useClipboard } from '../../../hooks/useLocalStorage';
import { AdFooter } from '../../../components/ads';
import { ToolInfoAuto } from './ToolInfoSection';
import { ToolHeader } from '../../../components/common';
import { 
  useDockerConverter, 
  type DockerRunOptions 
} from './docker-convert';
import { CodeEditor } from '../../../components/CodeEditor';

export function DockerConvertTool() {
  const [activeTab, setActiveTab] = useState<'run-to-compose' | 'compose-to-run' | 'form-to-docker'>('run-to-compose');
  const [dockerRunCommand, setDockerRunCommand] = useState('docker run -d --name nginx -p 8080:80 -v /data:/usr/share/nginx/html nginx:latest');
  const [composeYaml, setComposeYaml] = useState('');
  const [composeInput, setComposeInput] = useState('version: "3.8"\nservices:\n  web:\n    image: nginx:latest\n    container_name: nginx\n    ports:\n      - "8080:80"\n    volumes:\n      - /data:/usr/share/nginx/html');
  const [isConverting, setIsConverting] = useState(false);
  const [serviceName, setServiceName] = useState('app');

  const { copied, copy } = useClipboard();

  const {
    options,
    error,
    convertRunToOptions,
    convertComposeToOptions,
    getRunCommandFromCompose,
    updateOption,
    addArrayItem,
    removeArrayItem,
    updateArrayItem,
    resetOptions,
  } = useDockerConverter();

  // 处理 Run → Compose 转换
  const handleRunToCompose = useCallback(async () => {
    setIsConverting(true);
    try {
      const opts = await convertRunToOptions(dockerRunCommand);
      if (opts) {
        // 直接使用 opts 生成 compose，避免状态延迟
        const { generateDockerCompose } = await import('./docker-convert/generators');
        const compose = await generateDockerCompose(opts, serviceName);
        setComposeYaml(compose);
      }
    } finally {
      setIsConverting(false);
    }
  }, [dockerRunCommand, convertRunToOptions, serviceName]);

  // 处理 Compose → Run 转换
  const handleComposeToRun = useCallback(async () => {
    setIsConverting(true);
    try {
      // 使用 decomposerize 直接转换
      const runCmd = await getRunCommandFromCompose(composeInput);
      setDockerRunCommand(runCmd);
      
      // 同时解析选项用于预览
      await convertComposeToOptions(composeInput);
    } finally {
      setIsConverting(false);
    }
  }, [composeInput, getRunCommandFromCompose, convertComposeToOptions]);

  // 导出 compose 文件
  const exportCompose = () => {
    const blob = new Blob([composeYaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'docker-compose.yml';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 渲染解析结果预览
  const renderParsedInfo = (opts: DockerRunOptions) => (
    <div className="p-3 sm:p-4 bg-surface-50 dark:bg-surface-900/50 rounded-xl space-y-2">
      <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300">解析结果</h4>
      <div className="text-sm space-y-1">
        <p><span className="text-surface-500">镜像:</span> {opts.image}</p>
        {opts.name && <p><span className="text-surface-500">名称:</span> {opts.name}</p>}
        {opts.ports.length > 0 && <p><span className="text-surface-500">端口:</span> {opts.ports.map(p => `${p.host}:${p.container}`).join(', ')}</p>}
        {opts.volumes.length > 0 && <p><span className="text-surface-500">卷:</span> {opts.volumes.map(v => `${v.host}:${v.container}`).join(', ')}</p>}
        {opts.environment.length > 0 && <p><span className="text-surface-500">环境变量:</span> {opts.environment.map(e => e.key).join(', ')}</p>}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <ToolHeader
        title="Docker 命令转换"
        description="Docker run 命令与 Docker Compose 配置互转"
      />

      {/* Tab 切换 */}
      <div className="flex gap-1 border-b border-surface-200 dark:border-surface-700 mb-4 sm:mb-5">
        {[
          { id: 'run-to-compose', label: 'Run → Compose', icon: Terminal },
          { id: 'compose-to-run', label: 'Compose → Run', icon: FileJson },
          { id: 'form-to-docker', label: '表单配置', icon: Settings },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={`px-3 py-2 sm:px-4 sm:py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 -mb-px ${
              activeTab === id
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            }`}
          >
            <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'run-to-compose' && (
        <div className="grid lg:grid-cols-2 gap-3 sm:p-4 sm:gap-5">
          <div className="card p-3 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-surface-900 dark:text-surface-100 flex items-center gap-1.5 sm:gap-2">
                <Terminal className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 text-primary-500" />
                Docker Run 命令
              </h3>
              <button onClick={() => setDockerRunCommand('')} className="btn-ghost-danger btn-icon">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <CodeEditor
              value={dockerRunCommand}
              onChange={setDockerRunCommand}
              language="shell"
              placeholder="docker run -d --name myapp -p 8080:80 nginx"
              height={192}
              variant="embedded"
            />

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4" />
                {error}
              </div>
            )}

            <div className="flex gap-2 sm:gap-3">
              <button onClick={handleRunToCompose} disabled={isConverting} className="btn-primary btn-action flex-1">
                {isConverting ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" /> : <ArrowRightLeft className="w-4 h-4 flex-shrink-0" />}
                {isConverting ? '转换中...' : '转换'}
              </button>
              <button onClick={() => setDockerRunCommand('docker run -d --name nginx -p 8080:80 -v /data:/usr/share/nginx/html -e ENV=production --restart always nginx:latest')} className="btn-secondary btn-tool">
                示例
              </button>
            </div>

            {options.image && renderParsedInfo(options)}
          </div>

          <div className="card p-3 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-surface-900 dark:text-surface-100 flex items-center gap-1.5 sm:gap-2">
                <FileJson className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                Docker Compose
              </h3>
              <div className="flex gap-1.5 sm:gap-2">
                <input
                  type="text"
                  id="docker-service-name"
                  name="docker-service-name"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="服务名"
                  className="w-24 input text-xs py-1"
                />
                <button
                  onClick={() => copy(composeYaml)}
                  disabled={!composeYaml}
                  className={`btn-tool ${copied ? 'btn-ghost-success' : 'btn-secondary'}`}
                >
                  {copied ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
                </button>
                <button onClick={exportCompose} disabled={!composeYaml} className="btn-secondary btn-tool">
                  <Download className="w-3.5 h-3.5 flex-shrink-0" />
                </button>
              </div>
            </div>
            
            <CodeEditor
              value={composeYaml}
              onChange={() => {}}
              language="yaml"
              placeholder="点击转换按钮生成 docker-compose.yml..."
              height={384}
              readOnly
              variant="embedded"
            />
          </div>
        </div>
      )}

      {activeTab === 'compose-to-run' && (
        <div className="grid lg:grid-cols-2 gap-3 sm:p-4 sm:gap-5">
          <div className="card p-3 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-surface-900 dark:text-surface-100 flex items-center gap-1.5 sm:gap-2">
                <FileJson className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                Docker Compose
              </h3>
              <button onClick={() => setComposeInput('')} className="btn-ghost-danger btn-icon">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <CodeEditor
              value={composeInput}
              onChange={setComposeInput}
              language="yaml"
              placeholder={'version: "3.8"\nservices:\n  web:\n    image: nginx\n    ports:\n      - 8080:80'}
              height={384}
              variant="embedded"
            />

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4" />
                {error}
              </div>
            )}

            <div className="flex gap-2 sm:gap-3">
              <button onClick={handleComposeToRun} disabled={isConverting} className="btn-primary btn-action flex-1">
                {isConverting ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" /> : <ArrowRightLeft className="w-4 h-4 flex-shrink-0" />}
                {isConverting ? '转换中...' : '转换'}
              </button>
              <button onClick={() => setComposeInput('version: "3.8"\nservices:\n  web:\n    image: nginx:latest\n    container_name: nginx\n    ports:\n      - "8080:80"\n    volumes:\n      - /data:/usr/share/nginx/html\n    environment:\n      - ENV=production\n    restart: always')} className="btn-secondary btn-tool">
                示例
              </button>
            </div>
          </div>

          <div className="card p-3 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-surface-900 dark:text-surface-100 flex items-center gap-1.5 sm:gap-2">
                <Terminal className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 text-primary-500" />
                Docker Run 命令
              </h3>
              <button
                onClick={() => copy(dockerRunCommand)}
                disabled={!dockerRunCommand}
                className={`btn-tool ${copied ? 'btn-ghost-success' : 'btn-secondary'}`}
              >
                {copied ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
              </button>
            </div>
            
            <CodeEditor
              value={dockerRunCommand}
              onChange={() => {}}
              language="shell"
              placeholder="点击转换按钮生成 docker run 命令..."
              height={192}
              readOnly
              variant="embedded"
            />

            {options.image && renderParsedInfo(options)}
          </div>
        </div>
      )}

      {activeTab === 'form-to-docker' && (
        <FormConfigTab
          options={options}
          updateOption={updateOption}
          addArrayItem={addArrayItem}
          removeArrayItem={removeArrayItem}
          updateArrayItem={updateArrayItem}
          resetOptions={resetOptions}
          serviceName={serviceName}
          setServiceName={setServiceName}
          copied={copied}
          copy={copy}
          setOptions={(opts) => {
            // 批量更新选项
            Object.entries(opts).forEach(([key, value]) => {
              updateOption(key as keyof DockerRunOptions, value as any);
            });
          }}
        />
      )}

      {/* 功能说明 */}
      <ToolInfoAuto toolId="docker-convert" />

      <AdFooter />
    </div>
  );
}

// 表单配置标签页组件
interface FormConfigTabProps {
  options: DockerRunOptions;
  updateOption: <K extends keyof DockerRunOptions>(key: K, value: DockerRunOptions[K]) => void;
  addArrayItem: <K extends keyof DockerRunOptions>(key: K, item: any) => void;
  removeArrayItem: <K extends keyof DockerRunOptions>(key: K, index: number) => void;
  updateArrayItem: <K extends keyof DockerRunOptions>(key: K, index: number, value: any) => void;
  resetOptions: () => void;
  serviceName: string;
  setServiceName: (value: string) => void;
  copied: boolean;
  copy: (text: string) => void;
  setOptions: (opts: DockerRunOptions) => void;
}

function FormConfigTab({
  options,
  updateOption,
  addArrayItem,
  removeArrayItem,
  updateArrayItem,
  resetOptions,
  serviceName,
  setServiceName,
  copied,
  copy,
  setOptions
}: FormConfigTabProps) {
  const [runCommand, setRunCommand] = useState('');
  const [composeConfig, setComposeConfig] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [parseInput, setParseInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  const generate = async () => {
    setIsGenerating(true);
    try {
      // 本地生成 run 命令
      const { generateDockerRun } = await import('./docker-convert/generators');
      const cmd = generateDockerRun(options);
      setRunCommand(cmd);
      
      // 使用 composerize 库生成 compose
      const { generateDockerCompose } = await import('./docker-convert/generators');
      const compose = await generateDockerCompose(options, serviceName);
      setComposeConfig(compose);
    } finally {
      setIsGenerating(false);
    }
  };

  // 反向解析：从 docker run 或 compose 配置填充表单
  const handleParse = async () => {
    setIsParsing(true);
    setParseError('');
    try {
      const trimmed = parseInput.trim();
      if (!trimmed) {
        setParseError('请输入命令或配置');
        return;
      }

      let opts: DockerRunOptions | null = null;

      if (trimmed.startsWith('docker run')) {
        // 使用 composerize 解析 run 命令
        const { parseDockerRun } = await import('./docker-convert/parsers');
        const result = await parseDockerRun(trimmed);
        if (result.error) {
          setParseError(result.error);
          return;
        }
        opts = result.options;
      } else if (trimmed.includes('services:') || trimmed.includes('image:')) {
        // 使用 decomposerize 解析 compose 配置
        const { parseCompose } = await import('./docker-convert/parsers');
        const result = await parseCompose(trimmed);
        if (result.error) {
          setParseError(result.error);
          return;
        }
        opts = result.options;
      } else {
        setParseError('无法识别输入格式，请输入 docker run 命令或 docker-compose 配置');
        return;
      }

      if (opts) {
        setOptions(opts);
        // 同时生成结果
        const { generateDockerRun, generateDockerCompose } = await import('./docker-convert/generators');
        setRunCommand(generateDockerRun(opts));
        setComposeConfig(await generateDockerCompose(opts, serviceName));
      }
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-3 sm:p-4 sm:gap-5">
      <div className="card space-y-5 max-h-[800px] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-surface-900 dark:text-surface-100 flex items-center gap-1.5 sm:gap-2">
            <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 text-primary-500" />
            容器配置
          </h3>
          <div className="flex gap-1.5 sm:gap-2">
            <button onClick={generate} disabled={isGenerating} className="btn-primary btn-tool">
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" /> : '生成'}
            </button>
            <button onClick={resetOptions} className="btn-ghost btn-icon">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 反向解析 */}
        <div className="p-3 sm:p-4 bg-surface-50 dark:bg-surface-900/50 rounded-xl space-y-3">
          <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300 flex items-center gap-1.5 sm:gap-2">
            <ArrowRightLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4" />
            反向解析（粘贴命令自动填充表单）
          </h4>
          <CodeEditor
            value={parseInput}
            onChange={setParseInput}
            language="shell"
            placeholder="粘贴 docker run 命令或 docker-compose 配置..."
            height={96}
            variant="embedded"
          />
          {parseError && (
            <div className="text-xs text-red-500">{parseError}</div>
          )}
          <button 
            onClick={handleParse} 
            disabled={isParsing || !parseInput.trim()} 
            className="btn-secondary btn-action w-full"
          >
            {isParsing ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" /> : <ArrowRightLeft className="w-4 h-4 flex-shrink-0" />}
            {isParsing ? '解析中...' : '解析并填充表单'}
          </button>
        </div>

        {/* 基础配置 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300">基础配置</h4>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <input
              type="text"
              id="docker-image"
              name="docker-image"
              value={options.image}
              onChange={(e) => updateOption('image', e.target.value)}
              placeholder="镜像名 (必填)"
              className="input"
            />
            <input
              type="text"
              id="docker-container-name"
              name="docker-container-name"
              value={options.name || ''}
              onChange={(e) => updateOption('name', e.target.value)}
              placeholder="容器名"
              className="input"
            />
          </div>
          <input
            type="text"
            id="docker-command"
            name="docker-command"
            value={options.command || ''}
            onChange={(e) => updateOption('command', e.target.value)}
            placeholder="启动命令"
            className="w-full input"
          />
        </div>

        {/* 开关选项 */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {[
            { key: 'detach', label: '后台运行 (-d)' },
            { key: 'interactive', label: '交互模式 (-i)' },
            { key: 'tty', label: '伪终端 (-t)' },
            { key: 'remove', label: '自动删除 (--rm)' },
            { key: 'privileged', label: '特权模式 (--privileged)' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                id={`docker-option-${key}`}
                name={`docker-option-${key}`}
                checked={options[key as keyof DockerRunOptions] as boolean}
                onChange={(e) => updateOption(key as keyof DockerRunOptions, e.target.checked)}
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 rounded border-surface-300 text-primary-500"
              />
              <span className="text-sm text-surface-600 dark:text-surface-400">{label}</span>
            </label>
          ))}
        </div>

        {/* 端口映射 */}
        <ArrayConfigSection
          title="端口映射"
          items={options.ports}
          onAdd={() => addArrayItem('ports', { host: '', container: '', protocol: 'tcp' })}
          onRemove={(idx) => removeArrayItem('ports', idx)}
          renderItem={(port, idx) => (
            <div className="flex gap-1.5 sm:gap-2">
              <input
                type="text"
                id={`docker-port-host-${idx}`}
                name={`docker-port-host-${idx}`}
                value={port.host}
                onChange={(e) => updateArrayItem('ports', idx, { ...port, host: e.target.value })}
                placeholder="主机端口"
                className="flex-1 input py-1.5 text-sm"
              />
              <span className="self-center text-surface-400">:</span>
              <input
                type="text"
                id={`docker-port-container-${idx}`}
                name={`docker-port-container-${idx}`}
                value={port.container}
                onChange={(e) => updateArrayItem('ports', idx, { ...port, container: e.target.value })}
                placeholder="容器端口"
                className="flex-1 input py-1.5 text-sm"
              />
            </div>
          )}
        />

        {/* 卷映射 */}
        <ArrayConfigSection
          title="卷映射"
          items={options.volumes}
          onAdd={() => addArrayItem('volumes', { host: '', container: '', mode: 'rw' })}
          onRemove={(idx) => removeArrayItem('volumes', idx)}
          renderItem={(vol, idx) => (
            <div className="flex gap-1.5 sm:gap-2">
              <input
                type="text"
                id={`docker-vol-host-${idx}`}
                name={`docker-vol-host-${idx}`}
                value={vol.host}
                onChange={(e) => updateArrayItem('volumes', idx, { ...vol, host: e.target.value })}
                placeholder="主机路径"
                className="flex-1 input py-1.5 text-sm"
              />
              <span className="self-center text-surface-400">:</span>
              <input
                type="text"
                id={`docker-vol-container-${idx}`}
                name={`docker-vol-container-${idx}`}
                value={vol.container}
                onChange={(e) => updateArrayItem('volumes', idx, { ...vol, container: e.target.value })}
                placeholder="容器路径"
                className="flex-1 input py-1.5 text-sm"
              />
              <select
                id={`docker-vol-mode-${idx}`}
                name={`docker-vol-mode-${idx}`}
                value={vol.mode}
                onChange={(e) => updateArrayItem('volumes', idx, { ...vol, mode: e.target.value })}
                className="select py-1.5 text-sm w-20"
              >
                <option value="rw">rw</option>
                <option value="ro">ro</option>
              </select>
            </div>
          )}
        />

        {/* 环境变量 */}
        <ArrayConfigSection
          title="环境变量"
          items={options.environment}
          onAdd={() => addArrayItem('environment', { key: '', value: '' })}
          onRemove={(idx) => removeArrayItem('environment', idx)}
          renderItem={(env, idx) => (
            <div className="flex gap-1.5 sm:gap-2">
              <input
                type="text"
                id={`docker-env-key-${idx}`}
                name={`docker-env-key-${idx}`}
                value={env.key}
                onChange={(e) => updateArrayItem('environment', idx, { ...env, key: e.target.value })}
                placeholder="KEY"
                className="flex-1 input py-1.5 text-sm"
              />
              <span className="self-center text-surface-400">=</span>
              <input
                type="text"
                id={`docker-env-value-${idx}`}
                name={`docker-env-value-${idx}`}
                value={env.value}
                onChange={(e) => updateArrayItem('environment', idx, { ...env, value: e.target.value })}
                placeholder="value"
                className="flex-1 input py-1.5 text-sm"
              />
            </div>
          )}
        />

        {/* 其他选项 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300">其他选项</h4>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {[
              { key: 'restart', placeholder: '重启策略 (always/on-failure/no)' },
              { key: 'user', placeholder: '用户 (uid:gid)' },
              { key: 'workdir', placeholder: '工作目录' },
              { key: 'hostname', placeholder: '主机名' },
              { key: 'memory', placeholder: '内存限制 (512m, 1g)' },
              { key: 'cpus', placeholder: 'CPU 限制 (0.5, 1.5)' },
            ].map(({ key, placeholder }) => (
              <input
                key={key}
                type="text"
                id={`docker-other-${key}`}
                name={`docker-other-${key}`}
                value={(options[key as keyof DockerRunOptions] as string) || ''}
                onChange={(e) => updateOption(key as keyof DockerRunOptions, e.target.value)}
                placeholder={placeholder}
                className="input text-sm"
              />
            ))}
          </div>
        </div>
      </div>

      {/* 右侧：输出 */}
      <div className="space-y-5">
        <OutputPanel
          title="Docker Run 命令"
          icon={<Terminal className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 text-primary-500" />}
          value={runCommand}
          onCopy={() => copy(runCommand)}
          copied={copied}
        />

        <OutputPanel
          title="Docker Compose"
          icon={<FileJson className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:w-4 sm:h-4 text-emerald-500" />}
          value={composeConfig}
          onCopy={() => copy(composeConfig)}
          copied={copied}
          serviceName={serviceName}
          onServiceNameChange={setServiceName}
        />
      </div>
    </div>
  );
}

// 数组配置组件
interface ArrayConfigSectionProps<T> {
  title: string;
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
}

function ArrayConfigSection<T>({ title, items, onAdd, onRemove, renderItem }: ArrayConfigSectionProps<T>) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300">{title}</h4>
        <button onClick={onAdd} className="btn-ghost btn-icon">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          {renderItem(item, idx)}
          <button onClick={() => onRemove(idx)} className="btn-ghost-danger btn-icon p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// 输出面板组件
interface OutputPanelProps {
  title: string;
  icon: React.ReactNode;
  value: string;
  onCopy: () => void;
  copied: boolean;
  serviceName?: string;
  onServiceNameChange?: (value: string) => void;
}

function OutputPanel({ 
  title, 
  icon, 
  value, 
  onCopy, 
  copied,
  serviceName,
  onServiceNameChange 
}: OutputPanelProps) {
  return (
    <div className="card p-3 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-surface-900 dark:text-surface-100 flex items-center gap-1.5 sm:gap-2">
          {icon}
          {title}
        </h3>
        <div className="flex gap-1.5 sm:gap-2">
          {onServiceNameChange && (
            <input
              type="text"
              value={serviceName}
              onChange={(e) => onServiceNameChange(e.target.value)}
              placeholder="服务名"
              className="w-24 input text-xs py-1"
            />
          )}
          <button onClick={onCopy} disabled={!value} className={`btn-tool ${copied ? 'btn-ghost-success' : 'btn-secondary'}`}>
            {copied ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
          </button>
        </div>
      </div>
      <CodeEditor
        value={value}
        onChange={() => {}}
        language={title.includes('Compose') ? 'yaml' : 'shell'}
        placeholder="点击生成按钮..."
        height={192}
        readOnly
        variant="embedded"
      />
    </div>
  );
}
