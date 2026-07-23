#!/usr/bin/env bash
# Скачивает новые треки из плейлиста и пересобирает индекс.
# Запускается вручную или по cron.
set -euo pipefail

PLAYLIST="https://music.youtube.com/playlist?list=PLV6KRYjwKOT664Ex6BsUGNfOsKIR9iQaC"
MUSIC_DIR="/srv/music"
CACHE_DIR="/srv/cache"
APP_DIR="/opt/player"
COOKIES_FILE="/srv/cache/cookies.txt"
RUN_LOG="$CACHE_DIR/update-last-run.log"
UNAVAILABLE_LOG="$CACHE_DIR/unavailable-ids.txt"

echo "[update] Скачиваем новые треки..."

COOKIE_ARGS=()
if [ -f "$COOKIES_FILE" ]; then
  COOKIE_ARGS=(--cookies "$COOKIES_FILE")
else
  echo "[update] ВНИМАНИЕ: $COOKIES_FILE не найден. Экспортируй куки YouTube в этот файл." >&2
fi

mkdir -p "$CACHE_DIR"

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
  "$PLAYLIST" 2>&1 | tee "$RUN_LOG"

# yt-dlp logs per-video failures as "ERROR: [youtube] <id>: <reason>" — pull
# those ids out so unavailable tracks are visible without re-reading the full
# log, deduped by id across runs (same video usually fails the same way).
grep -oE '^ERROR: \[youtube\] [A-Za-z0-9_-]{11}: .+' "$RUN_LOG" \
  | sed -E 's/^ERROR: \[youtube\] //' >> "$UNAVAILABLE_LOG" || true
sort -u -t: -k1,1 -o "$UNAVAILABLE_LOG" "$UNAVAILABLE_LOG" 2>/dev/null || true

echo "[update] Сканируем библиотеку..."
cd "$APP_DIR"
MUSIC_DIR="$MUSIC_DIR" CACHE_DIR="$CACHE_DIR" npm run scan

echo "[update] Готово."
