'use client';
import { useOfflineStore } from '@/store/offline';
import Ic from '@/components/ui/Ic';

interface Props {
  trackId: string;
  className?: string;
}

export default function DownloadBadge({ trackId, className }: Props) {
  const downloaded = useOfflineStore((s) => !!s.downloaded[trackId]);
  const downloading = useOfflineStore((s) => !!s.downloading[trackId]);

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloading) return;
    const { downloadOne, deleteOne } = useOfflineStore.getState();
    if (downloaded) deleteOne(trackId);
    else downloadOne(trackId);
  };

  const cls = ['dlbadge', downloaded && 'on', downloading && 'busy', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={cls}
      title={downloading ? 'Загрузка…' : downloaded ? 'Скачан — нажмите, чтобы удалить' : 'Скачать для офлайна'}
      onClick={onClick}
    >
      {downloading ? (
        <span className="dlspin" aria-hidden />
      ) : downloaded ? (
        <Ic n="check" className="w-[15px] h-[15px]" />
      ) : (
        <Ic n="download" className="w-[15px] h-[15px]" />
      )}
    </button>
  );
}
