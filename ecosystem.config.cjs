module.exports = {
  apps: [
    // Application principale RS-Liv (API + Frontend)
    {
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
      error_file: './logs/app-err.log',
      out_file: './logs/app-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    // Bot Telegram interactif
    {
      name: 'rsliv-bot',
      script: './server/telegram-bot.js',
      instances: 1,
      exec_mode: 'fork',
      cwd: __dirname,
      env_file: '.env',
      autorestart: true,
      watch: false,
      max_memory_restart: '100M',
      error_file: './logs/bot-err.log',
      out_file: './logs/bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
