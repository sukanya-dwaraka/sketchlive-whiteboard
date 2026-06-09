import { useRef, useEffect, useState, useCallback } from 'react';
import { useCanvasDrawing } from '../hooks/useCanvasDrawing';
import { useSocket } from '../context/SocketContext';

export default function CanvasBoard({ tool, color, strokeWidth, roomId, onUsersUpdate }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null); // For remote cursors
  const { socket } = useSocket();
  const [remoteCursors, setRemoteCursors] = useState({});

  // ── Drawing callbacks ──────────────────────────────────────────────────────
  const handleStrokeComplete = useCallback(
    (strokeData) => {
      if (!socket || !roomId) return;
      socket.emit('draw', strokeData);
    },
    [socket, roomId]
  );

  const handleCursorMove = useCallback(
    (point) => {
      if (!socket || !roomId) return;
      socket.emit('cursor-move', point);
    },
    [socket, roomId]
  );

  const { startDrawing, draw, stopDrawing, renderRemoteStroke, replayStrokes, clearCanvas } =
    useCanvasDrawing({
      canvasRef,
      tool,
      color,
      strokeWidth,
      onStrokeComplete: handleStrokeComplete,
      onCursorMove: handleCursorMove,
    });

  // ── Socket event listeners ─────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onCanvasState = ({ strokes }) => {
      replayStrokes(strokes);
    };

    const onDraw = (strokeData) => {
      renderRemoteStroke(strokeData);
    };

    const onClearCanvas = () => {
      clearCanvas();
    };

    const onUsersUpdate = ({ users }) => {
      onUsersUpdate?.(users);
    };

    const onCursorMove = ({ userId, x, y, username, color }) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [userId]: { x, y, username, color, ts: Date.now() },
      }));
    };

    const onUserLeft = ({ userId }) => {
      setRemoteCursors((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    };

    socket.on('canvas-state', onCanvasState);
    socket.on('draw', onDraw);
    socket.on('clear-canvas', onClearCanvas);
    socket.on('users-update', onUsersUpdate);
    socket.on('cursor-move', onCursorMove);
    socket.on('user-left', onUserLeft);

    return () => {
      socket.off('canvas-state', onCanvasState);
      socket.off('draw', onDraw);
      socket.off('clear-canvas', onClearCanvas);
      socket.off('users-update', onUsersUpdate);
      socket.off('cursor-move', onCursorMove);
      socket.off('user-left', onUserLeft);
    };
  }, [socket, renderRemoteStroke, replayStrokes, clearCanvas, onUsersUpdate]);

  // Fade out stale cursors
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRemoteCursors((prev) => {
        const next = {};
        Object.entries(prev).forEach(([id, cursor]) => {
          if (now - cursor.ts < 3000) next[id] = cursor;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Resize canvas on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = canvas.parentElement.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
  }, []);

  const cursorClass = tool === 'eraser' ? 'cursor-eraser' : 'cursor-crosshair';

  return (
    <div className="relative w-full h-full bg-white rounded-lg overflow-hidden shadow-2xl">
      {/* Main drawing canvas */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full ${cursorClass}`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      {/* Remote cursor overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 10 }}
      >
        {Object.entries(remoteCursors).map(([userId, { x, y, username, color, ts }]) => {
          const age = Date.now() - ts;
          const opacity = age < 2000 ? 1 : Math.max(0, 1 - (age - 2000) / 1000);

          // Convert logical canvas coords to CSS % for overlay
          const canvas = canvasRef.current;
          if (!canvas) return null;
          const pctX = (x / canvas.width) * 100;
          const pctY = (y / canvas.height) * 100;

          return (
            <div
              key={userId}
              className="absolute flex items-center gap-1 transition-all duration-75"
              style={{
                left: `${pctX}%`,
                top: `${pctY}%`,
                opacity,
                transform: 'translate(4px, 4px)',
              }}
            >
              {/* SVG cursor dot */}
              <svg width="14" height="14" viewBox="0 0 14 14">
                <circle cx="7" cy="7" r="5" fill={color} stroke="white" strokeWidth="2" />
              </svg>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm"
                style={{ backgroundColor: color, color: '#fff' }}
              >
                {username}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
