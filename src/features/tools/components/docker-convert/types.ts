// Docker 转换工具类型定义

export interface DockerRunOptions {
  image: string;
  command?: string;
  name?: string;
  ports: Array<{ host: string; container: string; protocol: string }>;
  volumes: Array<{ host: string; container: string; mode: string }>;
  environment: Array<{ key: string; value: string }>;
  networks: string[];
  labels: Array<{ key: string; value: string }>;
  restart?: string;
  detach: boolean;
  interactive: boolean;
  tty: boolean;
  remove: boolean;
  privileged: boolean;
  user?: string;
  workdir?: string;
  hostname?: string;
  memory?: string;
  cpus?: string;
  extraHosts: Array<{ host: string; ip: string }>;
  dns: string[];
  envFile?: string;
  logDriver?: string;
  cpuShares?: number;
  shmSize?: string;
}

export const defaultOptions: DockerRunOptions = {
  image: '',
  ports: [],
  volumes: [],
  environment: [],
  networks: [],
  labels: [],
  extraHosts: [],
  dns: [],
  detach: true,
  interactive: false,
  tty: false,
  remove: false,
  privileged: false,
};
