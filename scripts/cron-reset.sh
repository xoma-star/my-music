#!/usr/bin/env bash
# Удаляет старые cron-задачи player-update и ставит ежедневный запуск в 04:00.
# DuckDNS-задачи не трогает.
set -euo pipefail

APP_DIR="/opt/player"

( crontab -l 2>/dev/null | grep -v "player-update" \
  ; echo "0 4 * * * $APP_DIR/scripts/update.sh >> /var/log/player-update.log 2>&1" \
) | crontab -

echo "Готово. Текущий crontab:"
crontab -l
