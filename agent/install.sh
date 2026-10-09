#!/usr/bin/env bash
# Usage: curl -fsSL https://raw.githubusercontent.com/juraevdev/meridian/master/agent/install.sh | sudo bash -s -- <meridian-url> <token>
set -euo pipefail

URL=${1:?usage: install.sh <meridian-url> <token>}
TOKEN=${2:?usage: install.sh <meridian-url> <token>}
SOURCE=${MERIDIAN_AGENT_SOURCE:-https://raw.githubusercontent.com/juraevdev/meridian/master/agent/meridian-agent.sh}

if [ "$(id -u)" -ne 0 ]; then
  echo "root huquqi kerak (sudo bilan ishga tushiring)" >&2
  exit 1
fi

install -d -m 0755 /opt/meridian-agent
curl -fsSL "$SOURCE" -o /opt/meridian-agent/meridian-agent.sh
chmod 0755 /opt/meridian-agent/meridian-agent.sh

(umask 077 && printf 'MERIDIAN_URL=%s\nMERIDIAN_TOKEN=%s\n' "$URL" "$TOKEN" > /etc/meridian-agent.env)

cat > /etc/systemd/system/meridian-agent.service <<'EOF'
[Unit]
Description=Meridian metrics agent
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
EnvironmentFile=/etc/meridian-agent.env
ExecStart=/opt/meridian-agent/meridian-agent.sh
EOF

cat > /etc/systemd/system/meridian-agent.timer <<'EOF'
[Unit]
Description=Send Meridian metrics every minute

[Timer]
OnBootSec=30s
OnUnitActiveSec=60s
AccuracySec=5s

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now meridian-agent.timer
systemctl start meridian-agent.service
echo "Meridian agent o'rnatildi: $(hostname) -> $URL"
