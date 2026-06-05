'use client';
import { useRef, useCallback } from 'react';

interface Props {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}

export default function Slider({ value, onChange, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const set = useCallback(
    (e: PointerEvent | React.PointerEvent) => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      onChange(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
    },
    [onChange],
  );

  const onDown = (e: React.PointerEvent) => {
    set(e);
    const mv = (ev: PointerEvent) => set(ev);
    const up = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  };

  const pct = `${value * 100}%`;
  return (
    <div ref={ref} className={`track ${className}`} onPointerDown={onDown}>
      <div className="fill" style={{ width: pct }} />
      <div className="knob" style={{ left: pct }} />
    </div>
  );
}
