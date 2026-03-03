import { useState } from 'react';
import { ExternalLink, Link as LinkIcon } from 'lucide-react';

export default function LinkCell({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(value || '');

  const handleSubmit = () => {
    onChange(url.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') { setUrl(value || ''); setEditing(false); } }}
        placeholder="https://..."
        className="w-full text-[11px] text-center px-1 py-0.5 border border-primary rounded outline-none"
      />
    );
  }

  if (value) {
    return (
      <div className="flex items-center justify-center gap-1 w-full group/link">
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-primary hover:underline truncate max-w-20"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-3.5 h-3.5 inline" />
        </a>
        <button
          onClick={() => { setUrl(value); setEditing(true); }}
          className="opacity-0 group-hover/link:opacity-100 text-[10px] text-text-disabled hover:text-primary"
        >
          editar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="w-full flex justify-center"
    >
      <LinkIcon className="w-3.5 h-3.5 text-text-disabled hover:text-primary transition-colors" />
    </button>
  );
}
