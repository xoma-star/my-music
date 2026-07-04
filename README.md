This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Скрипты

### Разворачивание на новом сервере

`scripts/vps-setup.sh` — запускать один раз, от root, на чистом Ubuntu 22.04/24.04:

```bash
bash scripts/vps-setup.sh
```

Ставит Docker, Node.js 22, yt-dlp и Caddy, настраивает домен (DuckDNS-поддомен или `<ip>.sslip.io`), клонирует репозиторий в `/opt/player`, скачивает плейлист в `/srv/music`, сканирует библиотеку, поднимает контейнер (`docker compose up -d --build`) и добавляет в cron ежечасный запуск `scripts/update.sh`.

### Обновление библиотеки (докачка новых треков)

`scripts/update.sh` — скачивает новые треки из плейлиста и пересобирает индекс:

```bash
scripts/update.sh
```

Уже вызывается по cron раз в час (настраивается в `vps-setup.sh`), но можно запускать и вручную. Внутри — `yt-dlp` (докачка только новых видео из плейлиста, `--download-archive`) и `npm run scan`.

### Пересканировать библиотеку без докачки

Если новые треки уже лежат в `MUSIC_DIR` (например, добавлены вручную) и скачивать через yt-dlp не нужно — достаточно пересобрать `data/cache/library.json` и обложки:

```bash
MUSIC_DIR=/srv/music CACHE_DIR=/srv/cache npm run scan
```

Рейтинги треков (`data/cache/ratings.db`) при этом не трогаются — `scan` их не касается, они привязаны к `id` трека и переживают пересканирование.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
