import { useState } from 'react';

export default function NumberCell({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [num, setNum] = useState(value ?? '');

  const handleSubmit = () => {
    const parsed = num === '' ? null : Number(num);
    onChange(parsed);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={num}
        onChange={(e) => setNum(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') { setNum(value ?? ''); setEditing(false); } }}
        className="w-full text-[12px] text-center px-1 py-0.5 border border-primary rounded outline-none"
      />
    );
  }

  return (
    <span
      className="text-[12px] text-text-secondary cursor-pointer hover:text-primary w-full text-center block"
      onClick={() => { setNum(value ?? ''); setEditing(true); }}
    >
      {value != null ? value : <span className="text-text-disabled">-</span>}
    </span>
  );
}
