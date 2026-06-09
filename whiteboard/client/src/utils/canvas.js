/**
 * Returns a throttled version of fn that fires at most once per `limit` ms.
 * Uses requestAnimationFrame for smooth canvas updates.
 */
export function throttle(fn, limit = 16) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Batch point emitter — collects points and flushes as a stroke batch.
 * This avoids emitting one socket event per pixel.
 */
export class StrokeBatcher {
  constructor(emitFn, flushInterval = 30) {
    this.emitFn = emitFn;
    this.buffer = [];
    this.flushInterval = flushInterval;
    this.timer = null;
  }

  addPoint(point) {
    this.buffer.push(point);
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  flush() {
    if (this.buffer.length > 0) {
      this.emitFn([...this.buffer]);
      this.buffer = [];
    }
    this.timer = null;
  }

  clear() {
    this.buffer = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

/**
 * Generate a short random ID
 */
export function shortId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

/**
 * Get canvas-relative coordinates from a mouse or touch event
 */
export function getCanvasPoint(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  if (e.touches && e.touches[0]) {
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY,
    };
  }
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}
