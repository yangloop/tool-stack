module.exports = {
  apps: [{
    name: 'tool-stack',
    script: './server.ts',
    interpreter: 'tsx',
    
    // 实例配置
    instances: 1,
    exec_mode: 'fork',
    
    // 环境变量
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // 日志配置
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 自动重启
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // 内存限制
    max_memory_restart: '512M',
    
    // 优雅关闭
    kill_timeout: 5000,
    listen_timeout: 10000,
    
    // 监控
    monitoring: false,
    
    // 集群模式（如果需要多核）
    // instances: 'max',
    // exec_mode: 'cluster',
  }]
}
