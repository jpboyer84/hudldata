import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import TrackerPage from './pages/TrackerPage';
import TemplateEditorPage from './pages/TemplateEditorPage';

export default function App() {
  const [gameId,          setGameId]          = useState(null);
  const [editTemplateId,  setEditTemplateId]  = useState(null);

  if (gameId !== null) {
    return <TrackerPage gameId={gameId} onBack={() => setGameId(null)} />;
  }
  if (editTemplateId !== null) {
    return <TemplateEditorPage templateId={editTemplateId} onBack={() => setEditTemplateId(null)} />;
  }
  return <LandingPage onOpenGame={setGameId} onEditTemplate={setEditTemplateId} />;
}
