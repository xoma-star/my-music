#!/usr/bin/env bash
# Скачивает новые треки из плейлиста и пересобирает индекс.
# Запускается вручную или по cron.
set -euo pipefail

PLAYLIST="https://music.youtube.com/playlist?list=PLV6KRYjwKOT664Ex6BsUGNfOsKIR9iQaC"
MUSIC_DIR="/srv/music"
CACHE_DIR="/srv/cache"
APP_DIR="/opt/player"
COOKIES_FILE="/srv/cache/cookies.txt"

echo "[update] Скачиваем новые треки..."

COOKIE_ARGS=()
if [ -f "$COOKIES_FILE" ]; then
  COOKIE_ARGS=(--cookies "$COOKIES_FILE")
else
  echo "[update] ВНИМАНИЕ: $COOKIES_FILE не найден. Экспортируй куки YouTube в этот файл." >&2
fi

yt-dlp \
  --extract-audio \
  --audio-format best \
  --convert-thumbnails jpg \
  --embed-thumbnail \
  --embed-metadata \
  --download-archive "$MUSIC_DIR/.archive" \
  --retries 10 \
  --fragment-retries 10 \
  --throttled-rate 100K \
  --sleep-requests 1 \
  --sleep-interval 2 \
  --max-sleep-interval 5 \
  --js-runtimes node \
  "${COOKIE_ARGS[@]}" \
  -o "$MUSIC_DIR/%(artist)s - %(title)s.%(ext)s" \
  "$PLAYLIST"

echo "[update] Сканируем библиотеку..."
cd "$APP_DIR"
MUSIC_DIR="$MUSIC_DIR" CACHE_DIR="$CACHE_DIR" npm run scan

echo "[update] Готово."
