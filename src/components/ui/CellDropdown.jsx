import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * CellDropdown
 * Renders dropdown content via a React portal on document.body so it is
 * never clipped by overflow:hidden ancestors (e.g. the board GroupSection).
 *
 * Props:
 *  - anchorRef  : ref attached to the trigger/container element
 *  - open       : boolean
 *  - onClose    : () => void
 *  - children   : dropdown content
 *  - align      : 'center' | 'left' | 'right'  (default 'center')
 *  - width      : number — dropdown width in px (default 160)
 *  - className  : extra classes for the panel
 */
export default function CellDropdown({
  anchorRef,
  open,
  onClose,
  children,
  align = 'center',
  width = 160,
  className = '',
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !anchorRef?.current) return;

    const rect = anchorRef.current.getBoundingClientRect();

    let left;
    if (align === 'center') {
      left = rect.left + rect.width / 2 - width / 2;
    } else if (align === 'right') {
      left = rect.right - width;
    } else {
      left = rect.left;
    }

    // Clamp so the panel never overflows the viewport horizontally
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));

    setPos({ top: rect.bottom + 4, left });
  }, [open, anchorRef, align, width]);

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop — closes the dropdown on outside click */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />

      {/* Dropdown panel */}
      <div
        style={{ position: 'fixed', top: pos.top, left: pos.left, width, zIndex: 9999 }}
        className={`bg-white rounded-lg shadow-lg border border-border-light py-1 animate-slide-down ${className}`}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
