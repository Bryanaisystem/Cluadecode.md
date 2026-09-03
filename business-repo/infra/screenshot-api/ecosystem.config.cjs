// PM2 process config for the screenshot API. Persist with `pm2 save` after starting
// (pair with `pm2 startup` for auto-launch on VM reboot).
// Fill in [USER] with the VM username before use.

module.exports = {
  apps: [{
    name: "screenshot-api",
    cwd: "/home/[USER]/screenshot-api",
    script: "/home/[USER]/screenshot-api/venv/bin/uvicorn",
    args: "app:app --host 0.0.0.0 --port 3333",
    exec_interpreter: "none",
    autorestart: true,
    env: {
      BUCKET_NAME: "n8n-outreach-invfewq",
      CHROMIUM_PATH: "/usr/bin/chromium"
    }
  }]
};
