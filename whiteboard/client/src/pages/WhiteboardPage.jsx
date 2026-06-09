import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import CanvasBoard from '../components/CanvasBoard';
import Toolbar from '../components/Toolbar';
import UsersPanel from '../components/UsersPanel';
import { useSocket } from '../context/SocketContext';

export default function WhiteboardPage() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const username = searchParams.get('username') || 'Anonymous';

  const { socket, connected } = useSocket();

  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#1a1a1a');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [users, setUsers] = useState([]);
  const [joinError, setJoinError] = useState('');
  const [joined, setJoined] = useState(false);
  const hasJoined = useRef(false);

  // ── Join room when socket connects ───────────────────────────────────────
  useEffect(() => {
    if (!socket || !connected || hasJoined.current) return;

    hasJoined.current = true;
    socket.emit('join-room', { roomId, username });
    setJoined(true);

    socket.on('error', ({ message }) => {
      setJoinError(message);
    });

    socket.on('users-update', ({ users }) => {
      setUsers(users);
    });

    return () => {
      socket.off('error');
      socket.off('users-update');
    };
  }, [socket, connected, roomId, username]);

  const handleUsersUpdate = useCallback((newUsers) => {
    setUsers(newUsers);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'p' || e.key === 'P') setTool('pen');
      if (e.key === 'e' || e.key === 'E') setTool('eraser');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (joinError) {
    return (
      <div className="min-h-screen bg-canvas-bg flex items-center justify-center">
        <div className="bg-canvas-surface border border-red-500/30 rounded-2xl p-8 text-center max-w-sm">
          <div className="text-red-400 text-4xl mb-4">⚠</div>
          <h2 className="text-canvas-text font-semibold text-lg mb-2">Room not found</h2>
          <p className="text-canvas-muted text-sm mb-6">{joinError}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-canvas-accent hover:bg-canvas-accent-light text-white rounded-lg font-medium transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-canvas-bg overflow-hidden">
      {/* Top header */}
      <header className="flex items-center justify-between px-4 py-3 bg-canvas-surface border-b border-canvas-border shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-canvas-muted hover:text-canvas-text transition-colors text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Home
          </button>
          <span className="text-canvas-border">|</span>
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C5CFF" strokeWidth="2" strokeLinecap="round">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <span className="text-canvas-text font-semibold text-sm">SketchLive</span>
          </div>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse-soft' : 'bg-red-400'}`} />
          <span className="text-xs text-canvas-muted">{connected ? 'Connected' : 'Reconnecting…'}</span>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex flex-1 gap-3 p-3 overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Toolbar */}
          <div className="flex justify-center">
            <Toolbar
              tool={tool}
              setTool={setTool}
              color={color}
              setColor={setColor}
              strokeWidth={strokeWidth}
              setStrokeWidth={setStrokeWidth}
              roomId={roomId}
            />
          </div>

          {/* Canvas */}
          <div className="flex-1 rounded-xl overflow-hidden shadow-2xl border border-canvas-border min-h-0">
            {joined && (
              <CanvasBoard
                tool={tool}
                color={color}
                strokeWidth={strokeWidth}
                roomId={roomId}
                onUsersUpdate={handleUsersUpdate}
              />
            )}
          </div>

          {/* Shortcuts hint */}
          <div className="flex justify-center gap-4 text-[10px] text-canvas-muted">
            <span><kbd className="bg-canvas-border px-1.5 py-0.5 rounded font-mono">P</kbd> Pen</span>
            <span><kbd className="bg-canvas-border px-1.5 py-0.5 rounded font-mono">E</kbd> Eraser</span>
          </div>
        </div>

        {/* Right sidebar */}
        <UsersPanel users={users} roomId={roomId} />
      </div>
    </div>
  );
}
