# SketchLive — Real-Time Collaborative Whiteboard

A full-stack, real-time collaborative whiteboard built with **React + Vite**, **Node.js + Express**, and **Socket.IO**. Multiple users can draw simultaneously on the same canvas, see each other's cursors in real time, and share boards via a Room ID.

---

## 📁 Folder Structure

```
whiteboard/
├── server/                     # Node.js + Express + Socket.IO backend
│   ├── src/
│   │   ├── index.js            # Entry point — Express + Socket.IO setup
│   │   ├── models/
│   │   │   ├── Room.js         # Mongoose schema (optional, for MongoDB)
│   │   │   └── memoryStore.js  # In-memory fallback (no DB required)
│   │   ├── routes/
│   │   │   └── rooms.js        # REST API: create/get rooms
│   │   └── socket/
│   │       └── handlers.js     # All Socket.IO event handlers
│   ├── .env.example
│   └── package.json
│
└── client/                     # React + Vite frontend
    ├── src/
    │   ├── context/
    │   │   └── SocketContext.jsx   # Global socket.io-client instance
    │   ├── hooks/
    │   │   └── useCanvasDrawing.js # Core drawing + rendering logic
    │   ├── components/
    │   │   ├── CanvasBoard.jsx     # Canvas + remote cursor overlay
    │   │   ├── Toolbar.jsx         # Tool/color/size controls
    │   │   └── UsersPanel.jsx      # Online users sidebar
    │   ├── pages/
    │   │   ├── HomePage.jsx        # Create / join room
    │   │   └── WhiteboardPage.jsx  # Main whiteboard view
    │   ├── utils/
    │   │   └── canvas.js           # Throttle, StrokeBatcher, coord helpers
    │   └── main.jsx
    ├── .env.example
    └── package.json
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- MongoDB (optional — app runs in-memory without it)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd whiteboard

# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### 2. Configure environment

**Server** (`server/.env`):
```env
PORT=4000
FRONTEND_URL=http://localhost:5173
# Optional — remove to run without persistence:
# MONGO_URI=mongodb://localhost:27017/whiteboard
```

**Client** (`client/.env`):
```env
VITE_SERVER_URL=http://localhost:4000
```

### 3. Start both servers

**Terminal 1 — Backend:**
```bash
cd server
npm run dev      # uses nodemon for hot-reload
# or: npm start  # production mode
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

Open **http://localhost:5173** in two browser tabs to test real-time collaboration.

---

## 🎯 Feature Overview

| Feature | Details |
|---|---|
| Room system | Create rooms (8-char ID); join by ID |
| Drawing tools | Pen, Eraser |
| Color picker | 10 presets + custom hex via `<input type="color">` |
| Stroke sizes | 5 sizes (2–28px) |
| Real-time sync | Strokes broadcast via Socket.IO to all room members |
| Remote cursors | Live cursor positions with username labels, fades after 3s idle |
| Canvas state | New joiners receive full canvas history on join |
| Clear canvas | Clears for all users in the room simultaneously |
| Persistence | Optional MongoDB — falls back to in-memory automatically |
| Performance | Stroke batching, cursor throttle at 50ms, quadratic curve smoothing |
| Keyboard shortcuts | `P` = pen, `E` = eraser |
| Touch support | Full mobile/tablet touch drawing |

---

## ⚡ Socket.IO Event Reference

| Event | Direction | Payload |
|---|---|---|
| `join-room` | Client → Server | `{ roomId, username }` |
| `canvas-state` | Server → Client | `{ strokes[] }` — full history on join |
| `draw` | Bidirectional | `{ points[], color, width, isEraser }` |
| `clear-canvas` | Bidirectional | _(none)_ |
| `cursor-move` | Bidirectional | `{ x, y }` / `{ userId, x, y, username, color }` |
| `users-update` | Server → Client | `{ users[] }` |
| `user-joined` | Server → Client | `{ userId, username, color }` |
| `user-left` | Server → Client | `{ userId, username }` |
| `error` | Server → Client | `{ message }` |

---

## 🌐 Deployment

### Backend (Railway / Render / Fly.io)

1. Push `server/` to a repo or deploy directly
2. Set environment variables:
   - `PORT` (usually set automatically)
   - `FRONTEND_URL` = your frontend domain
   - `MONGO_URI` = your MongoDB Atlas connection string (optional)
3. Start command: `npm start`

### Frontend (Vercel / Netlify)

1. Set `VITE_SERVER_URL` = your backend URL (e.g. `https://whiteboard-api.railway.app`)
2. Build command: `npm run build`
3. Publish directory: `dist`

### Docker (optional)

```dockerfile
# server/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src ./src
EXPOSE 4000
CMD ["node", "src/index.js"]
```

---

## 🏗️ Architecture Notes

**Why batched strokes?**  
Emitting one socket event per mouse pixel would generate ~60 events/second per user. Instead, points are buffered for 30ms and sent as a batch, reducing events by 10-20×.

**Why quadratic curves?**  
Raw `lineTo` point-by-point produces jagged lines at high speed. Quadratic Bezier curves through midpoints produce smooth strokes visually identical to Excalidraw's approach.

**Why in-memory fallback?**  
Makes development and deployment zero-config. MongoDB adds durable persistence for production but is never required to run the app.
