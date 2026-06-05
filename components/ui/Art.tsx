import { artBg, hueFromId } from '@/lib/data';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  hue?: number;
  hasCover?: boolean;
  size?: number;
}

export default function Art({ id, hue, hasCover, className = '', style, ...props }: Props) {
  const resolvedHue = hue ?? (id ? hueFromId(id) : 0);

  if (hasCover && id) {
    return (
      <div
        className={`art ${className}`}
        style={{ background: artBg(resolvedHue), ...style }}
        {...props}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/cover/${id}`}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      </div>
    );
  }

  return (
    <div
      className={`art ${className}`}
      style={{ background: artBg(resolvedHue), ...style }}
      {...props}
    />
  );
}
