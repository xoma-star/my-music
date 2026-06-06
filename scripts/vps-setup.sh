#!/usr/bin/env bash
# Запускать на свежем Ubuntu 22.04/24.04 от root:
#   bash vps-setup.sh
set -euo pipefail

# ══════════════════════════════════════════════════════════════════
REPO_URL="https://github.com/xoma-star/my-music.git"

# Домен: оставь пустым → IP.sslip.io (без регистрации)
#         или укажи поддомен DuckDNS → имя.duckdns.org
DUCKDNS_SUBDOMAIN="xoma-play"
# ══════════════════════════════════════════════════════════════════

PLAYLIST="https://music.youtube.com/playlist?list=PLV6KRYjwKOT664Ex6BsUGNfOsKIR9iQaC"
MUSIC_DIR="/srv/music"
CACHE_DIR="/srv/cache"
APP_DIR="/opt/player"

# ── 1. Системные пакеты ──────────────────
echo "==> Обновление системы"
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq git curl ffmpeg \
  debian-keyring debian-archive-keyring apt-transport-https

# ── 2. Docker ────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "==> Установка Docker"
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

# ── 3. Node.js 22 ────────────────────────
if ! command -v node &>/dev/null; then
  echo "==> Установка Node.js 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

# ── 4. yt-dlp ────────────────────────────
echo "==> Установка yt-dlp"
curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  -o /usr/local/bin/yt-dlp
chmod a+rx /usr/local/bin/yt-dlp

# ── 5. Caddy ─────────────────────────────
if ! command -v caddy &>/dev/null; then
  echo "==> Установка Caddy"
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq && apt-get install -y caddy
fi

# ── 6. Определяем домен ──────────────────
IP=$(curl -s4 ifconfig.me)

if [ -n "$DUCKDNS_SUBDOMAIN" ]; then
  read -rsp "==> DuckDNS token для ${DUCKDNS_SUBDOMAIN}: " DUCKDNS_TOKEN
  echo ""
fi

if [ -n "$DUCKDNS_SUBDOMAIN" ] && [ -n "$DUCKDNS_TOKEN" ]; then
  echo "==> Регистрируем IP в DuckDNS"
  curl -s "https://www.duckdns.org/update?domains=${DUCKDNS_SUBDOMAIN}&token=${DUCKDNS_TOKEN}&ip=${IP}" \
    && echo ""
  DOMAIN="${DUCKDNS_SUBDOMAIN}.duckdns.org"
else
  DOMAIN="${IP}.sslip.io"
fi

echo "==> Домен: https://${DOMAIN}"

# ── 7. Настройка Caddy ───────────────────
cat > /etc/caddy/Caddyfile <<EOF
${DOMAIN} {
    reverse_proxy localhost:3000
}
EOF
systemctl enable --now caddy
systemctl restart caddy

# ── 8. Репозиторий ───────────────────────
echo "==> Клонирование репозитория"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull
else
  git clone "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"
npm ci --silent

# ── 9. Директории ────────────────────────
mkdir -p "$MUSIC_DIR" "$CACHE_DIR"

# ── 10. Скачать плейлист ─────────────────
echo "==> Скачивание плейлиста (это займёт время)"
COOKIES_FILE="$CACHE_DIR/cookies.txt"
COOKIE_ARGS=()
if [ -f "$COOKIES_FILE" ]; then
  COOKIE_ARGS=(--cookies "$COOKIES_FILE")
else
  echo "==> ВНИМАНИЕ: $COOKIES_FILE не найден."
  echo "    Экспортируй куки YouTube в этот файл перед первым запуском:"
  echo "    1. Установи расширение 'Get cookies.txt LOCALLY' в Chrome/Firefox"
  echo "    2. Зайди на youtube.com, экспортируй куки"
  echo "    3. Скопируй файл на VPS: scp cookies.txt root@<IP>:$COOKIES_FILE"
fi
yt-dlp \
  --extract-audio \
  --audio-format best \
  --embed-thumbnail \
  --embed-metadata \
  --download-archive "$MUSIC_DIR/.archive" \
  --js-runtimes node \
  "${COOKIE_ARGS[@]}" \
  -o "$MUSIC_DIR/%(artist)s - %(title)s.%(ext)s" \
  "$PLAYLIST"

# ── 11. Сканер ───────────────────────────
echo "==> Сканирование библиотеки"
MUSIC_DIR="$MUSIC_DIR" CACHE_DIR="$CACHE_DIR" npm run scan

# ── 12. Запуск плеера ────────────────────
echo "==> Сборка и запуск Docker-контейнера"
docker compose up -d --build

# ── 13. Cron ─────────────────────────────
echo "==> Настройка cron"
chmod +x "$APP_DIR/scripts/update.sh"

CRON_PLAYER="0 * * * * $APP_DIR/scripts/update.sh >> /var/log/player-update.log 2>&1"
if [ -n "$DUCKDNS_SUBDOMAIN" ] && [ -n "$DUCKDNS_TOKEN" ]; then
  # Обновлять IP в DuckDNS каждые 5 минут (на случай смены IP)
  CRON_DNS="*/5 * * * * curl -s 'https://www.duckdns.org/update?domains=${DUCKDNS_SUBDOMAIN}&token=${DUCKDNS_TOKEN}&ip=' > /dev/null"
  ( crontab -l 2>/dev/null | grep -v "player-update\|duckdns"; echo "$CRON_PLAYER"; echo "$CRON_DNS" ) | crontab -
else
  ( crontab -l 2>/dev/null | grep -v "player-update"; echo "$CRON_PLAYER" ) | crontab -
fi

# ── Готово ───────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo "  Плеер запущен!"
echo "  Открывай: https://${DOMAIN}"
echo ""
echo "  Новые треки появляются автоматически"
echo "  каждый час (добавь в плейлист на YT Music)"
echo "════════════════════════════════════════"
