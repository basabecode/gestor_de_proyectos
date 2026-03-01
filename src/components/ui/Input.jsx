import { cn } from '../../lib/utils';

export default function Input({ className, error, label, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-[13px] font-medium text-text-secondary mb-1">{label}</label>}
      <input
        className={cn(
          'w-full px-3 py-2 text-[14px] rounded-[4px] border transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
          'placeholder:text-text-disabled',
          error ? 'border-status-red' : 'border-border',
          className
        )}
        {...props}
      />
      {error && <p className="text-[11px] text-status-red mt-1">{error}</p>}
    </div>
  );
}
