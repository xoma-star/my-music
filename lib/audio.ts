let el: HTMLAudioElement | null = null;

export function setAudioEl(audio: HTMLAudioElement | null) {
  el = audio;
}

export function seekAudio(t: number) {
  if (el) el.currentTime = t;
}

export function reportPlayback(id: string, playedSec: number, durationSec: number) {
  if (!id || !durationSec) return;
  fetch(`/api/tracks/${id}/playback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playedSec, durationSec }),
    keepalive: true,
  }).catch(() => { /* best-effort rating signal */ });
}
