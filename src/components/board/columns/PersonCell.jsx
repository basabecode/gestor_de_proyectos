import { useState, useRef } from 'react';
import { Avatar } from '../../ui';
import CellDropdown from '../../ui/CellDropdown';
import { Plus, X } from 'lucide-react';
import useUserStore from '@/stores/userStore';
import { usePermission } from '@/lib/permissions';

export default function PersonCell({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const teamMembers = useUserStore((s) => s.teamMembers);
  const canAssign = usePermission('assign:items');

  // Resolve display name: value may be a UUID (new) or a name string (legacy)
  const memberRecord = teamMembers.find((m) => m.id === value);
  const displayName = memberRecord?.name || value || '';

  const handleOpen = () => {
    if (!canAssign) return;
    setOpen(!open);
  };

  return (
    <div ref={anchorRef} className="relative w-full flex justify-center">
      {displayName ? (
        <div className="flex items-center gap-1 cursor-pointer group/person" onClick={handleOpen}>
          <Avatar name={displayName} size="xs" />
          <span className="text-[11px] text-text-secondary truncate max-w-17.5">{displayName.split(' ')[0]}</span>
          {canAssign && (
            <button
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="opacity-0 group-hover/person:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-text-disabled hover:text-status-red" />
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={handleOpen}
          disabled={!canAssign}
          className="w-6 h-6 rounded-full border border-dashed border-border hover:border-primary flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3 h-3 text-text-disabled" />
        </button>
      )}

      <CellDropdown anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} width={160}>
        {teamMembers.map((m) => (
          <button
            key={m.id}
            onClick={() => { onChange(m.id); setOpen(false); }}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-surface-secondary text-[12px] text-text-primary"
          >
            <Avatar name={m.name} size="xs" />
            {m.name}
          </button>
        ))}
        {teamMembers.length === 0 && (
          <p className="px-3 py-2 text-[11px] text-text-disabled">Sin miembros en el workspace</p>
        )}
      </CellDropdown>
    </div>
  );
}
