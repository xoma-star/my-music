#!/usr/bin/env bash
# Скачивает новые треки из плейлиста и пересобирает индекс.
# Запускается вручную или по cron.
set -euo pipefail

PLAYLIST="https://music.youtube.com/playlist?list=PLV6KRYjwKOT664Ex6BsUGNfOsKIR9iQaC"
MUSIC_DIR="/srv/music"
CACHE_DIR="/srv/cache"
APP_DIR="/opt/player"

echo "[update] Скачиваем новые треки..."
yt-dlp \
  --extract-audio \
  --audio-format best \
  --embed-thumbnail \
  --embed-metadata \
  --download-archive "$MUSIC_DIR/.archive" \
  -o "$MUSIC_DIR/%(artist)s - %(title)s.%(ext)s" \
  "$PLAYLIST"

echo "[update] Сканируем библиотеку..."
cd "$APP_DIR"
MUSIC_DIR="$MUSIC_DIR" CACHE_DIR="$CACHE_DIR" npm run scan

echo "[update] Готово."
