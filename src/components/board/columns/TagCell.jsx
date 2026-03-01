import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { hashColor } from '../../../lib/utils';

export default function TagCell({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');
  const tags = Array.isArray(value) ? value : value ? [value] : [];

  const addTag = () => {
    const tag = input.trim();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput('');
    setEditing(false);
  };

  const removeTag = (tag) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className="flex items-center justify-center gap-1 flex-wrap w-full px-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white"
          style={{ backgroundColor: hashColor(tag) }}
        >
          {tag}
          <button onClick={() => removeTag(tag)} className="hover:opacity-70">
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
      {editing ? (
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onBlur={addTag}
          onKeyDown={(e) => { if (e.key === 'Enter') addTag(); if (e.key === 'Escape') { setInput(''); setEditing(false); } }}
          className="w-12 text-[10px] px-1 py-0.5 border border-primary rounded outline-none"
          placeholder="tag"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="p-0.5 hover:bg-surface-hover rounded transition-colors"
        >
          <Plus className="w-3 h-3 text-text-disabled hover:text-primary" />
        </button>
      )}
    </div>
  );
}
