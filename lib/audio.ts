let el: HTMLAudioElement | null = null;

export function setAudioEl(audio: HTMLAudioElement | null) {
  el = audio;
}

export function seekAudio(t: number) {
  if (el) el.currentTime = t;
}
