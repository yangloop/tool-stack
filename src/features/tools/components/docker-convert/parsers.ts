// Docker 命令解析器 - 使用第三方库

import type { DockerRunOptions } from './types';
import { defaultOptions } from './types';

export interface ParseResult {
  options: DockerRunOptions | null;
  error: string | null;
}

// 解析 docker run 命令（使用 composerize 库）
export async function parseDockerRun(cmd: string): Promise<ParseResult> {
  try {
    const trimmed = cmd.trim();
    if (!trimmed.startsWith('docker run')) {
      throw new Error('命令必须以 "docker run" 开头');
    }

    // 动态导入 composerize (CommonJS 模块)
    const composerizeModule = await import('composerize');
    const composerize = composerizeModule.default || composerizeModule;
    const composeYaml = composerize(trimmed);
    
    // 然后从 compose 解析出选项
    return parseComposeInternal(composeYaml);
  } catch (err) {
    return { options: null, error: err instanceof Error ? err.message : '解析失败' };
  }
}

// 解析 docker-compose.yml（使用 decomposerize 库）
export async function parseCompose(yaml: string): Promise<ParseResult> {
  try {
    // 动态导入 decomposerize (CommonJS 模块)
    const decomposerizeModule = await import('decomposerize');
    const decomposerize = decomposerizeModule.default || decomposerizeModule;
    const runCommand = decomposerize(yaml);
    
    // 然后从 run 命令解析出选项
    return parseDockerRunInternal(runCommand);
  } catch (err) {
    return { options: null, error: err instanceof Error ? err.message : '解析失败' };
  }
}

// 内部函数：从 docker run 命令解析选项
function parseDockerRunInternal(cmd: string): ParseResult {
  try {
    const opts: DockerRunOptions = { 
      ...defaultOptions,
      ports: [],
      volumes: [],
      environment: [],
      networks: [],
      labels: [],
      extraHosts: [],
      dns: []
    };

    const trimmed = cmd.trim();
    if (!trimmed.startsWith('docker run')) {
      throw new Error('命令必须以 "docker run" 开头');
    }

    const args = trimmed.substring('docker run'.length).trim();
    const tokens = args.match(/(?:"[^"]*"|'[^']*'|\S)+/g) || [];
    
    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];
      
      switch (token) {
        case '-d':
        case '--detach':
          opts.detach = true;
          break;
        case '-i':
        case '--interactive':
          opts.interactive = true;
          break;
        case '-t':
        case '--tty':
          opts.tty = true;
          break;
        case '--rm':
          opts.remove = true;
          break;
        case '--privileged':
          opts.privileged = true;
          break;
        case '-p':
        case '--publish':
          i++;
          if (tokens[i]) {
            const parts = tokens[i].split(':');
            if (parts.length >= 2) {
              opts.ports.push({
                host: parts[0],
                container: parts[parts.length - 1],
                protocol: 'tcp'
              });
            }
          }
          break;
        case '-v':
        case '--volume':
          i++;
          if (tokens[i]) {
            const parts = tokens[i].split(':');
            if (parts.length >= 2) {
              opts.volumes.push({
                host: parts[0],
                container: parts[1],
                mode: parts[2] || 'rw'
              });
            }
          }
          break;
        case '-e':
        case '--env':
          i++;
          if (tokens[i]) {
            const [key, ...valueParts] = tokens[i].split('=');
            opts.environment.push({
              key: key,
              value: valueParts.join('=') || ''
            });
          }
          break;
        case '--name':
          i++;
          if (tokens[i]) opts.name = tokens[i].replace(/["']/g, '');
          break;
        case '--network':
          i++;
          if (tokens[i]) opts.networks.push(tokens[i].replace(/["']/g, ''));
          break;
        case '--restart':
          i++;
          if (tokens[i]) opts.restart = tokens[i].replace(/["']/g, '');
          break;
        case '-u':
        case '--user':
          i++;
          if (tokens[i]) opts.user = tokens[i].replace(/["']/g, '');
          break;
        case '-w':
        case '--workdir':
          i++;
          if (tokens[i]) opts.workdir = tokens[i].replace(/["']/g, '');
          break;
        case '-h':
        case '--hostname':
          i++;
          if (tokens[i]) opts.hostname = tokens[i].replace(/["']/g, '');
          break;
        case '--memory':
        case '-m':
          i++;
          if (tokens[i]) opts.memory = tokens[i].replace(/["']/g, '');
          break;
        case '--cpus':
          i++;
          if (tokens[i]) opts.cpus = tokens[i].replace(/["']/g, '');
          break;
        case '--add-host':
          i++;
          if (tokens[i]) {
            const parts = tokens[i].split(':');
            if (parts.length === 2) {
              opts.extraHosts.push({ host: parts[0], ip: parts[1] });
            }
          }
          break;
        case '--dns':
          i++;
          if (tokens[i]) opts.dns.push(tokens[i].replace(/["']/g, ''));
          break;
        default:
          if (!token.startsWith('-')) {
            const prevToken = i > 0 ? tokens[i - 1] : '';
            const valueOptions = ['-p', '--publish', '-v', '--volume', '-e', '--env', '--name', '--network', 
              '--restart', '-u', '--user', '-w', '--workdir', '--hostname', '--memory', 
              '--cpus', '--add-host', '--dns', '--env-file', '--log-driver', '--shm-size', '--cpu-shares'];
            
            const isOptionValue = valueOptions.includes(prevToken);
            
            if (!isOptionValue && !opts.image) {
              opts.image = token.replace(/["']/g, '');
            } else if (!isOptionValue && opts.image && !opts.command) {
              opts.command = tokens.slice(i).map(t => t.replace(/["']/g, '')).join(' ');
              i = tokens.length;
            }
          }
          break;
      }
      i++;
    }

    if (!opts.image) {
      throw new Error('未找到镜像名称');
    }

    return { options: opts, error: null };
  } catch (err) {
    return { options: null, error: err instanceof Error ? err.message : '解析失败' };
  }
}

// 内部函数：从 compose 解析选项（简单解析器）
function parseComposeInternal(yaml: string): ParseResult {
  try {
    const opts: DockerRunOptions = { 
      ...defaultOptions,
      ports: [],
      volumes: [],
      environment: [],
      networks: [],
      labels: [],
      extraHosts: [],
      dns: []
    };

    const lines = yaml.split('\n');
    let inServices = false;
    let inService = false;
    let serviceBaseIndent = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.startsWith('#')) continue;

      const match = line.match(/^(\s*)/);
      const indent = match ? match[1].length : 0;

      if (trimmed === 'services:' || trimmed.startsWith('services:')) {
        inServices = true;
        continue;
      }

      if (inServices && indent === 0 && trimmed.endsWith(':')) {
        inServices = false;
        inService = false;
        continue;
      }

      if (!inServices) continue;

      if (!inService && indent > 0 && trimmed.endsWith(':') && !trimmed.startsWith('-')) {
        inService = true;
        serviceBaseIndent = indent;
        continue;
      }

      if (!inService) continue;

      if (indent <= serviceBaseIndent) {
        inService = false;
        continue;
      }

      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();

      switch (key.trim()) {
        case 'image':
          opts.image = value;
          break;
        case 'container_name':
          opts.name = value;
          break;
        case 'command':
          opts.command = value;
          break;
        case 'restart':
          opts.restart = value;
          break;
        case 'user':
          opts.user = value;
          break;
        case 'working_dir':
          opts.workdir = value;
          break;
        case 'hostname':
          opts.hostname = value;
          break;
        case 'privileged':
          opts.privileged = value === 'true';
          break;
        case 'shm_size':
          opts.shmSize = value;
          break;
        case 'cpu_shares':
          opts.cpuShares = parseInt(value) || 0;
          break;
      }

      if (key.trim() === 'ports' || key.trim() === 'volumes' || 
          key.trim() === 'environment' || key.trim() === 'networks' || 
          key.trim() === 'dns' || key.trim() === 'extra_hosts' ||
          key.trim() === 'labels') {
        const arrayKey = key.trim();
        let j = i + 1;
        while (j < lines.length) {
          const nextLine = lines[j];
          const nextTrimmed = nextLine.trim();
          const nextIndent = nextLine.match(/^(\s*)/)?.[1].length || 0;
          
          if (nextIndent <= indent) break;
          
          if (nextTrimmed.startsWith('-')) {
            const itemValue = nextTrimmed.substring(1).trim();
            
            switch (arrayKey) {
              case 'ports':
                const cleanPort = itemValue.replace(/"/g, '');
                if (cleanPort.includes(':')) {
                  const parts = cleanPort.split(':');
                  opts.ports.push({
                    host: parts[0],
                    container: parts[1],
                    protocol: 'tcp'
                  });
                } else {
                  opts.ports.push({
                    host: cleanPort,
                    container: cleanPort,
                    protocol: 'tcp'
                  });
                }
                break;
              case 'volumes':
                if (itemValue.includes(':')) {
                  const parts = itemValue.split(':');
                  opts.volumes.push({
                    host: parts[0],
                    container: parts[1],
                    mode: parts[2] || 'rw'
                  });
                }
                break;
              case 'environment':
                if (itemValue.includes('=')) {
                  const [k, ...v] = itemValue.split('=');
                  opts.environment.push({ key: k.trim(), value: v.join('=').trim() });
                } else if (itemValue.includes(':')) {
                  const [k, ...v] = itemValue.split(':');
                  opts.environment.push({ key: k.trim(), value: v.join(':').trim() });
                }
                break;
              case 'networks':
                opts.networks.push(itemValue);
                break;
              case 'dns':
                opts.dns.push(itemValue);
                break;
              case 'extra_hosts':
                if (itemValue.includes(':')) {
                  const [h, ip] = itemValue.split(':');
                  opts.extraHosts.push({ host: h.trim(), ip: ip.trim() });
                }
                break;
              case 'labels':
                if (itemValue.includes('=')) {
                  const [k, ...v] = itemValue.split('=');
                  opts.labels.push({ key: k.trim(), value: v.join('=').trim() });
                }
                break;
            }
          }
          j++;
        }
      }
    }

    if (!opts.image) {
      throw new Error('未找到镜像名称');
    }

    return { options: opts, error: null };
  } catch (err) {
    return { options: null, error: err instanceof Error ? err.message : '解析失败' };
  }
}
