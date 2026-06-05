export const artBg = (hue: number) =>
  `linear-gradient(135deg, hsl(${hue} 70% 58%), hsl(${(hue + 50) % 360} 65% 42%))`;

export const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function hueFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) % 360;
  }
  return h;
}
