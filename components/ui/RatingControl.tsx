'use client';

interface Props {
  trackId: string;
  rating: number;
  onChange: (id: string, rating: number) => void;
}

export default function RatingControl({ trackId, rating, onChange }: Props) {
  // Skips/completions nudge the true rating by fractional amounts (see .claude/readme);
  // the badge rounds for display, but +/- always steps the underlying value by exactly 1.
  const shown = Math.round(rating);
  const cls = shown > 0 ? 'pos' : shown < 0 ? 'neg' : '';

  const step = (delta: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(trackId, rating + delta);
  };

  return (
    <div className="rating" onClick={(e) => e.stopPropagation()}>
      <button className="rating-step" title="Понизить рейтинг" onClick={step(-1)}>−</button>
      <span className={`rating-badge ${cls}`}>{shown > 0 ? `+${shown}` : shown}</span>
      <button className="rating-step" title="Повысить рейтинг" onClick={step(1)}>+</button>
    </div>
  );
}
