import * as mm from 'music-metadata';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const MUSIC_DIR = process.env.MUSIC_DIR ?? path.join(process.cwd(), 'data', 'music');
const CACHE_DIR = process.env.CACHE_DIR ?? path.join(process.cwd(), 'data', 'cache');

const AUDIO_EXTS = new Set(['.mp3', '.m4a', '.aac', '.flac', '.ogg', '.opus', '.wav', '.wma']);

const EXT_CODEC: Record<string, string> = {
  '.mp3': 'mp3', '.m4a': 'm4a', '.aac': 'aac', '.flac': 'flac',
  '.ogg': 'ogg', '.opus': 'opus', '.wav': 'wav', '.wma': 'wma',
};

function hashPath(p: string): string {
  return crypto.createHash('sha1').update(p).digest('hex').slice(0, 16);
}

function walk(dir: string): string[] {
  const results: string[] = [];
  try {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) results.push(...walk(full));
      else if (AUDIO_EXTS.has(path.extname(e.name).toLowerCase())) results.push(full);
    }
  } catch { /* skip unreadable dirs */ }
  return results;
}

async function main() {
  if (!fs.existsSync(MUSIC_DIR)) {
    console.error(`MUSIC_DIR not found: ${MUSIC_DIR}`);
    process.exit(1);
  }

  const coversDir = path.join(CACHE_DIR, 'covers');
  fs.mkdirSync(coversDir, { recursive: true });

  const files = walk(MUSIC_DIR);
  console.log(`Scanning ${files.length} files in ${MUSIC_DIR}`);

  const tracks = [];
  let ok = 0, fail = 0;

  for (const file of files) {
    const rel = path.relative(MUSIC_DIR, file);
    const id = hashPath(rel);
    const ext = path.extname(file).toLowerCase();

    try {
      const { common, format } = await mm.parseFile(file, { skipCovers: false, duration: true });

      const cover = mm.selectCover(common.picture);
      let hasCover = false;
      if (cover) {
        const coverFile = path.join(coversDir, `${id}.jpg`);
        if (!fs.existsSync(coverFile)) fs.writeFileSync(coverFile, cover.data);
        hasCover = true;
      }

      tracks.push({
        id,
        title: common.title ?? path.basename(file, ext),
        artist: common.artist ?? common.albumartist ?? 'Unknown',
        ...(common.album ? { album: common.album } : {}),
        ...(common.year ? { year: common.year } : {}),
        ...(common.track?.no ? { trackNo: common.track.no } : {}),
        durationSec: Math.round(format.duration ?? 0),
        path: rel,
        codec: format.codec?.toLowerCase().split(/[^a-z]/)[0] ?? EXT_CODEC[ext] ?? 'mp3',
        ...(format.bitrate ? { bitrate: Math.round(format.bitrate / 1000) } : {}),
        hasCover,
      });
      ok++;
      process.stdout.write('.');
    } catch (e) {
      fail++;
      console.error(`\nFailed: ${rel} —`, (e as Error).message);
    }
  }

  console.log(`\nDone: ${ok} ok, ${fail} failed`);

  const outFile = path.join(CACHE_DIR, 'library.json');
  fs.writeFileSync(outFile, JSON.stringify(tracks, null, 2));
  console.log(`Wrote ${outFile}`);
}

main().catch(console.error);
