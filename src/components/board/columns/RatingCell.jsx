import { Star } from 'lucide-react';

export default function RatingCell({ value, onChange }) {
  const rating = value || 0;

  return (
    <div className="flex items-center justify-center gap-0.5 w-full">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star === rating ? 0 : star)}
          className="transition-colors"
        >
          <Star
            className={`w-3.5 h-3.5 ${
              star <= rating ? 'text-status-yellow fill-status-yellow' : 'text-text-disabled'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
