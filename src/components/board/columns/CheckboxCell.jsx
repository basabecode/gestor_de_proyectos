export default function CheckboxCell({ value, onChange }) {
  return (
    <div className="flex justify-center w-full">
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded cursor-pointer accent-primary"
      />
    </div>
  );
}
