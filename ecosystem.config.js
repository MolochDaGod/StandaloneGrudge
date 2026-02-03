module.exports = {
  apps: [{
    name: 'grudge-warlords-server',
    script: './server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    kill_timeout: 5000,
    listen_timeout: 10000,
    shutdown_with_message: true
  }, {
    name: 'grudge-unity-server',
    script: './builds/server/GrudgeWarlordsServer',
    instances: 1,
    exec_mode: 'fork',
    env: {
      UNITY_SERVER_PORT: process.env.UNITY_SERVER_PORT || 7777
    },
    error_file: './logs/unity-error.log',
    out_file: './logs/unity-out.log',
    autorestart: true,
    max_memory_restart: '2G'
  }]
};
