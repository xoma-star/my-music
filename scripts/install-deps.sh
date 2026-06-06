#!/usr/bin/env bash
# Устанавливает Python-зависимости для yt-dlp.
# Запускать один раз на VPS от root.
set -euo pipefail

echo "==> Установка зависимостей yt-dlp"
apt-get install -y -qq python3-pip
python3 -m pip install --quiet mutagen

echo "==> Готово."
