// Docker 命令生成器 - 使用第三方库

import type { DockerRunOptions } from './types';

// 使用 composerize 生成 docker-compose.yml
export async function generateDockerCompose(
  opts: DockerRunOptions, 
  serviceName: string
): Promise<string> {
  // 构建 docker run 命令
  const runCommand = generateDockerRun(opts);
  
  // 使用 composerize 转换 (CommonJS 模块)
  const composerizeModule = await import('composerize');
  const composerize = composerizeModule.default || composerizeModule;
  const composeYaml = composerize(runCommand);
  
  // 替换服务名
  return composeYaml.replace(/name: <your project name>/, '').replace(/services:\s*\n\s+\w+:/, `services:\n    ${serviceName}:`);
}

// 使用 decomposerize 生成 docker run 命令
export async function generateDockerRunFromCompose(yaml: string): Promise<string> {
  const decomposerizeModule = await import('decomposerize');
  const decomposerize = decomposerizeModule.default || decomposerizeModule;
  return decomposerize(yaml);
}

// 生成 docker run 命令（本地实现，用于表单配置）
export function generateDockerRun(opts: DockerRunOptions): string {
  const parts = ['docker run'];
  
  if (opts.detach) parts.push('-d');
  if (opts.interactive) parts.push('-i');
  if (opts.tty) parts.push('-t');
  if (opts.remove) parts.push('--rm');
  if (opts.privileged) parts.push('--privileged');
  
  if (opts.name) parts.push(`--name ${opts.name}`);
  if (opts.user) parts.push(`-u ${opts.user}`);
  if (opts.workdir) parts.push(`-w ${opts.workdir}`);
  if (opts.hostname) parts.push(`-h ${opts.hostname}`);
  if (opts.restart) parts.push(`--restart ${opts.restart}`);
  if (opts.memory) parts.push(`-m ${opts.memory}`);
  if (opts.cpus) parts.push(`--cpus ${opts.cpus}`);
  if (opts.shmSize) parts.push(`--shm-size ${opts.shmSize}`);
  if (opts.cpuShares) parts.push(`--cpu-shares ${opts.cpuShares}`);
  if (opts.envFile) parts.push(`--env-file ${opts.envFile}`);
  if (opts.logDriver) parts.push(`--log-driver ${opts.logDriver}`);
  
  opts.ports.forEach(p => {
    parts.push(`-p ${p.host}:${p.container}`);
  });
  
  opts.volumes.forEach(v => {
    parts.push(`-v ${v.host}:${v.container}${v.mode !== 'rw' ? ':' + v.mode : ''}`);
  });
  
  opts.environment.forEach(e => {
    parts.push(`-e ${e.key}=${e.value}`);
  });
  
  opts.networks.forEach(n => {
    parts.push(`--network ${n}`);
  });
  
  opts.labels.forEach(l => {
    parts.push(`--label ${l.key}=${l.value}`);
  });
  
  opts.extraHosts.forEach(h => {
    parts.push(`--add-host ${h.host}:${h.ip}`);
  });
  
  opts.dns.forEach(d => {
    parts.push(`--dns ${d}`);
  });
  
  parts.push(opts.image);
  
  if (opts.command) {
    parts.push(opts.command);
  }
  
  return parts.join(' \\\n  ');
}
