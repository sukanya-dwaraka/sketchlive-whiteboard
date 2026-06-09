export default function UsersPanel({ users, roomId }) {
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      // Brief visual feedback handled by CSS
    });
  };

  return (
    <div className="flex flex-col gap-3 w-56 shrink-0">
      {/* Room ID card */}
      <div className="bg-canvas-surface border border-canvas-border rounded-xl p-3">
        <p className="text-[10px] uppercase tracking-widest text-canvas-muted font-semibold mb-2">Room</p>
        <div className="flex items-center gap-2">
          <code className="font-mono text-sm text-canvas-accent font-semibold tracking-wider flex-1">
            {roomId}
          </code>
          <button
            onClick={copyRoomId}
            title="Copy Room ID"
            className="w-7 h-7 rounded-md flex items-center justify-center text-canvas-muted hover:text-canvas-text hover:bg-canvas-border transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-canvas-muted mt-1.5">Share to invite others</p>
      </div>

      {/* Online users */}
      <div className="bg-canvas-surface border border-canvas-border rounded-xl p-3 flex-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-widest text-canvas-muted font-semibold">Online</p>
          <span className="text-[10px] font-semibold text-canvas-accent bg-canvas-accent/10 px-1.5 py-0.5 rounded-full">
            {users.length}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {users.length === 0 && (
            <p className="text-xs text-canvas-muted italic">No users yet</p>
          )}
          {users.map((user) => (
            <div key={user.userId} className="flex items-center gap-2 animate-fade-in">
              {/* Avatar */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                style={{ backgroundColor: user.color }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-canvas-text font-medium truncate">{user.username}</p>
              </div>
              {/* Live indicator */}
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
