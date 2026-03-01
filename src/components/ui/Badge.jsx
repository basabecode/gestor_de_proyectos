import { cn } from '../../lib/utils';

export default function Badge({ children, color, className, onClick }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-2 py-0.5 rounded-[2px] text-[11px] font-semibold leading-tight',
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      style={{ backgroundColor: color || '#c4c4c4', color: '#fff' }}
      onClick={onClick}
    >
      {children}
    </span>
  );
}
