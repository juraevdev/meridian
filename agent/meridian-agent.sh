#!/usr/bin/env bash
# Sends one metrics report to Meridian. Run every minute by meridian-agent.timer.
set -euo pipefail

: "${MERIDIAN_URL:?MERIDIAN_URL is not set}"
: "${MERIDIAN_TOKEN:?MERIDIAN_TOKEN is not set}"

cpu_sample() {
  read -r _ user nice system idle iowait irq softirq steal _ < /proc/stat
  echo "$((idle + iowait)) $((user + nice + system + idle + iowait + irq + softirq + steal))"
}

read -r idle1 total1 < <(cpu_sample)
sleep 1
read -r idle2 total2 < <(cpu_sample)
total_delta=$((total2 - total1))
cpu=0
if [ "$total_delta" -gt 0 ]; then
  cpu=$((100 * (total_delta - (idle2 - idle1)) / total_delta))
fi

mem_total_kb=$(awk '/^MemTotal:/ {print $2}' /proc/meminfo)
mem_available_kb=$(awk '/^MemAvailable:/ {print $2}' /proc/meminfo)
read -r disk_total_kb disk_used_kb < <(df -kP / | awk 'NR == 2 {print $2, $3}')
read -r load1 load5 load15 _ < /proc/loadavg
uptime_sec=$(cut -d. -f1 /proc/uptime)

os_name=$(. /etc/os-release 2>/dev/null && echo "${PRETTY_NAME:-Linux}" || echo Linux)
clean() { printf '%s' "$1" | tr -d '"\\' | tr -cd '[:print:]'; }

containers=null
if command -v docker >/dev/null 2>&1; then
  containers=$(docker ps -q 2>/dev/null | wc -l) || containers=null
fi

payload=$(printf '{"hostname":"%s","os":"%s","kernel":"%s","cores":%s,"cpu":%s,"memTotalKb":%s,"memAvailableKb":%s,"diskTotalKb":%s,"diskUsedKb":%s,"load":[%s,%s,%s],"uptimeSec":%s,"containers":%s}' \
  "$(clean "$(hostname)")" "$(clean "$os_name")" "$(clean "$(uname -r)")" "$(nproc)" "$cpu" \
  "$mem_total_kb" "$mem_available_kb" "$disk_total_kb" "$disk_used_kb" \
  "$load1" "$load5" "$load15" "$uptime_sec" "$containers")

curl -fsS -m 20 -o /dev/null \
  -H "Authorization: Bearer ${MERIDIAN_TOKEN}" \
  -H 'Content-Type: application/json' \
  --data "$payload" \
  "${MERIDIAN_URL%/}/api/agent/report"
