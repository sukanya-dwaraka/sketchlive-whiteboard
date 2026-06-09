import { useSocket } from '../context/SocketContext';

const PRESET_COLORS = [
  '#1a1a1a', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
  '#ffffff', '#64748b',
];

const STROKE_SIZES = [
  { label: 'XS', value: 2 },
  { label: 'S', value: 4 },
  { label: 'M', value: 8 },
  { label: 'L', value: 16 },
  { label: 'XL', value: 28 },
];

function ToolButton({ active, onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150
        ${active
          ? 'bg-canvas-accent text-white shadow-lg shadow-canvas-accent/30'
          : 'text-canvas-text-dim hover:bg-canvas-border hover:text-canvas-text'
        }
      `}
    >
      {children}
    </button>
  );
}

export default function Toolbar({ tool, setTool, color, setColor, strokeWidth, setStrokeWidth, roomId }) {
  const { socket } = useSocket();

  const handleClear = () => {
    if (!socket || !roomId) return;
    if (confirm('Clear the canvas for everyone?')) {
      socket.emit('clear-canvas');
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-canvas-surface border border-canvas-border rounded-xl shadow-xl">

      {/* Tool selection */}
      <div className="flex items-center gap-1 border-r border-canvas-border pr-3">
        <ToolButton active={tool === 'pen'} onClick={() => setTool('pen')} title="Pen (P)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </ToolButton>

        <ToolButton active={tool === 'eraser'} onClick={() => setTool('eraser')} title="Eraser (E)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M20 20H7L3 16l12-12 5 5-7.5 7.5"/>
            <path d="M6.5 17.5l-1-1"/>
          </svg>
        </ToolButton>
      </div>

      {/* Color palette */}
      <div className="flex items-center gap-1.5 border-r border-canvas-border pr-3">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => { setColor(c); setTool('pen'); }}
            title={c}
            className="rounded-full transition-all duration-100 hover:scale-110 focus:outline-none"
            style={{
              backgroundColor: c,
              width: color === c && tool === 'pen' ? 22 : 16,
              height: color === c && tool === 'pen' ? 22 : 16,
              border: color === c && tool === 'pen' ? '2px solid #7C5CFF' : '1.5px solid rgba(255,255,255,0.15)',
              flexShrink: 0,
            }}
          />
        ))}
        {/* Custom color picker */}
        <label className="relative w-8 h-8 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-canvas-border flex items-center justify-center" title="Custom color">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-canvas-text-dim pointer-events-none">
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
            <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
          </svg>
          <input
            type="color"
            value={color}
            onChange={(e) => { setColor(e.target.value); setTool('pen'); }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
      </div>

      {/* Stroke width */}
      <div className="flex items-center gap-1 border-r border-canvas-border pr-3">
        {STROKE_SIZES.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setStrokeWidth(value)}
            title={`${label} (${value}px)`}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-xs font-medium duration-150 ${
              strokeWidth === value
                ? 'bg-canvas-accent text-white'
                : 'text-canvas-text-dim hover:bg-canvas-border'
            }`}
          >
            <div
              className="rounded-full bg-current"
              style={{ width: Math.min(value, 16), height: Math.min(value, 16) }}
            />
          </button>
        ))}
      </div>

      {/* Actions */}
      <button
        onClick={handleClear}
        title="Clear canvas"
        className="w-10 h-10 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
        </svg>
      </button>
    </div>
  );
}
