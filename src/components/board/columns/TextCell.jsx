import { useState } from 'react';

export default function TextCell({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value || '');

  const handleSubmit = () => {
    onChange(text);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') { setText(value || ''); setEditing(false); } }}
        className="w-full text-[12px] text-center px-1 py-0.5 border border-primary rounded outline-none"
      />
    );
  }

  return (
    <span
      className="text-[12px] text-text-secondary cursor-pointer hover:text-primary truncate w-full text-center block px-1"
      onClick={() => { setText(value || ''); setEditing(true); }}
    >
      {value || <span className="text-text-disabled">-</span>}
    </span>
  );
}
