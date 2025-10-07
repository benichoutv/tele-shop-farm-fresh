module.exports = {
  apps: [{
    name: 'rsliv-app',
    script: './server/index.js',
    instances: 1,
    exec_mode: 'fork',
    cwd: __dirname,
    env_file: '.env',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
