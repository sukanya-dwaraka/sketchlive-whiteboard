import { useEffect, useRef, useCallback } from 'react';
import { getCanvasPoint, throttle } from '../utils/canvas';

/**
 * Draws a smooth stroke from an array of points onto a canvas context.
 */
function drawStroke(ctx, points, color, width, isEraser = false) {
  if (!points || points.length < 2) return;

  ctx.save();
  ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
  ctx.strokeStyle = isEraser ? 'rgba(0,0,0,1)' : color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
  ctx.restore();
}

export function useCanvasDrawing({ canvasRef, tool, color, strokeWidth, onStrokeComplete, onCursorMove }) {
  const isDrawing = useRef(false);
  const currentPoints = useRef([]);
  const lastEmittedPoints = useRef([]);

  // Throttled cursor move emitter (~20fps)
  const throttledCursorMove = useRef(
    throttle((point) => {
      onCursorMove?.(point);
    }, 50)
  ).current;

  const startDrawing = useCallback(
    (e) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      isDrawing.current = true;
      const point = getCanvasPoint(e, canvas);
      currentPoints.current = [point];
    },
    [canvasRef]
  );

  const draw = useCallback(
    (e) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const point = getCanvasPoint(e, canvas);

      // Emit cursor position for collaborators (throttled)
      throttledCursorMove(point);

      if (!isDrawing.current) return;

      currentPoints.current.push(point);

      // Live-render current stroke on canvas
      const ctx = canvas.getContext('2d');
      const isEraser = tool === 'eraser';
      drawStroke(ctx, currentPoints.current, color, strokeWidth, isEraser);

      // Emit incremental batches to collaborators
      const newPoints = currentPoints.current.slice(lastEmittedPoints.current.length);
      if (newPoints.length >= 3) {
        onStrokeComplete?.({
          type: 'partial',
          points: currentPoints.current,
          color,
          width: strokeWidth,
          isEraser,
        });
        lastEmittedPoints.current = [...currentPoints.current];
      }
    },
    [canvasRef, tool, color, strokeWidth, onStrokeComplete, throttledCursorMove]
  );

  const stopDrawing = useCallback(
    (e) => {
      if (!isDrawing.current) return;
      e.preventDefault?.();

      isDrawing.current = false;

      if (currentPoints.current.length > 0) {
        const isEraser = tool === 'eraser';
        // Emit the complete final stroke
        onStrokeComplete?.({
          type: 'complete',
          points: currentPoints.current,
          color,
          width: strokeWidth,
          isEraser,
        });
      }

      currentPoints.current = [];
      lastEmittedPoints.current = [];
    },
    [tool, color, strokeWidth, onStrokeComplete]
  );

  // Render a stroke received from a remote user
  const renderRemoteStroke = useCallback(
    (strokeData) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      drawStroke(ctx, strokeData.points, strokeData.color, strokeData.width, strokeData.isEraser);
    },
    [canvasRef]
  );

  // Replay all strokes (used when joining a room)
  const replayStrokes = useCallback(
    (strokes) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      strokes.forEach((s) => {
        if (s.type !== 'clear') {
          drawStroke(ctx, s.points, s.color, s.width, s.isEraser);
        }
      });
    },
    [canvasRef]
  );

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle window resize — maintain logical pixel size
    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = canvas.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        // Save current content
        const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').putImageData(imageData, 0, 0);
      }
    });
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [canvasRef]);

  return { startDrawing, draw, stopDrawing, renderRemoteStroke, replayStrokes, clearCanvas };
}
