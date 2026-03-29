import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import TrackerPage from './pages/TrackerPage';

export default function App() {
  const [gameId, setGameId] = useState(null);

  if (gameId !== null) {
    return <TrackerPage gameId={gameId} onBack={() => setGameId(null)} />;
  }
  return <LandingPage onOpenGame={setGameId} />;
}
