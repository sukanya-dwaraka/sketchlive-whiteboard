import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';
console.log("SERVER_URL:", SERVER_URL);

export default function HomePage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'join'

  const handleCreate = async () => {
    if (!username.trim()) return setError('Enter your name to continue');
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${SERVER_URL}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create room');
      navigate(`/room/${data.roomId}?username=${encodeURIComponent(username.trim())}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = () => {
    if (!username.trim()) return setError('Enter your name to continue');
    const id = joinRoomId.trim().toUpperCase();
    if (!id) return setError('Enter a Room ID');
    navigate(`/room/${id}?username=${encodeURIComponent(username.trim())}`);
  };

  const onKey = (e, fn) => e.key === 'Enter' && fn();

  return (
    <div className="min-h-screen bg-canvas-bg flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#7C5CFF 1px, transparent 1px), linear-gradient(90deg, #7C5CFF 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow orb */}
      <div
        className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7C5CFF, transparent)', top: '20%', left: '40%' }}
      />

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-canvas-accent/10 border border-canvas-accent/20 mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7C5CFF" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-canvas-text tracking-tight">Sketch<span className="text-canvas-accent">Live</span></h1>
          <p className="text-canvas-text-dim text-sm mt-1.5">Real-time collaborative whiteboard</p>
        </div>

        {/* Card */}
        <div className="bg-canvas-surface border border-canvas-border rounded-2xl p-6 shadow-2xl">
          {/* Name input — always shown */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-canvas-muted uppercase tracking-wider mb-2">
              Your Name
            </label>
            <input
              type="text"
              placeholder="e.g. Alice"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => onKey(e, activeTab === 'create' ? handleCreate : handleJoin)}
              className="w-full bg-canvas-bg border border-canvas-border rounded-lg px-4 py-2.5 text-canvas-text placeholder-canvas-muted text-sm focus:outline-none focus:border-canvas-accent focus:ring-1 focus:ring-canvas-accent/40 transition-all"
              maxLength={24}
            />
          </div>

          {/* Tabs */}
          <div className="flex bg-canvas-bg rounded-xl p-1 mb-5 border border-canvas-border">
            {['create', 'join'].map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-canvas-accent text-white shadow-md'
                    : 'text-canvas-muted hover:text-canvas-text'
                }`}
              >
                {tab === 'create' ? '+ Create Room' : 'Join Room'}
              </button>
            ))}
          </div>

          {activeTab === 'create' ? (
            <div>
              <p className="text-xs text-canvas-muted mb-4">
                Start a new board. You'll get a shareable Room ID to invite others.
              </p>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-canvas-accent hover:bg-canvas-accent-light text-white font-semibold transition-all shadow-lg shadow-canvas-accent/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeOpacity=".3"/>
                      <path d="M12 2a10 10 0 0 1 10 10"/>
                    </svg>
                    Creating…
                  </span>
                ) : 'Create Board →'}
              </button>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-canvas-muted uppercase tracking-wider mb-2">
                Room ID
              </label>
              <input
                type="text"
                placeholder="e.g. A1B2C3D4"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                onKeyDown={(e) => onKey(e, handleJoin)}
                className="w-full bg-canvas-bg border border-canvas-border rounded-lg px-4 py-2.5 text-canvas-text placeholder-canvas-muted text-sm font-mono tracking-widest focus:outline-none focus:border-canvas-accent focus:ring-1 focus:ring-canvas-accent/40 transition-all mb-4"
                maxLength={8}
              />
              <button
                onClick={handleJoin}
                className="w-full py-3 rounded-xl bg-canvas-accent hover:bg-canvas-accent-light text-white font-semibold transition-all shadow-lg shadow-canvas-accent/25"
              >
                Join Board →
              </button>
            </div>
          )}

          {error && (
            <p className="mt-3 text-xs text-red-400 text-center animate-fade-in">⚠ {error}</p>
          )}
        </div>

        {/* Feature pills */}
        <div className="flex justify-center gap-3 mt-6 flex-wrap">
          {['Real-time sync', 'Cursor sharing', 'Persistent rooms'].map((f) => (
            <span key={f} className="text-[11px] text-canvas-muted border border-canvas-border rounded-full px-3 py-1">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
