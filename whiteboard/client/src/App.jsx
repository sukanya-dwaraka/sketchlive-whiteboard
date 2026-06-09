import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import HomePage from './pages/HomePage';
import WhiteboardPage from './pages/WhiteboardPage';

export default function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room/:roomId" element={<WhiteboardPage />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}
