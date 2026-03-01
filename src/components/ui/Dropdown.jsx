import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

export default function Dropdown({ trigger, children, align = 'left', className }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-flex">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1 bg-white rounded-lg shadow-lg border border-border-light py-1 min-w-[160px] animate-slide-down',
            align === 'right' ? 'right-0' : 'left-0',
            'top-full',
            className
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ children, onClick, danger, icon: Icon, className }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-3 py-2 text-left text-[13px] flex items-center gap-2 transition-colors',
        danger ? 'text-status-red hover:bg-status-red-light' : 'text-text-primary hover:bg-surface-secondary',
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}
