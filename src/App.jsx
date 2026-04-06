import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import TrackerPage from './pages/TrackerPage';
import TemplateEditorPage from './pages/TemplateEditorPage';
import LibraryColumnEditorPage from './pages/LibraryColumnEditorPage';
import GameArchivePage from './pages/GameArchivePage';
import NewTemplatePage from './pages/NewTemplatePage';
import NewColumnPage from './pages/NewColumnPage';

export default function App() {
  const [view,             setView]             = useState('landing');
  const [gameId,           setGameId]           = useState(null);
  const [editTemplateId,   setEditTemplateId]   = useState(null);
  const [editLibraryColId, setEditLibraryColId] = useState(null);

  if (view === 'tracker' && gameId !== null) {
    return (
      <TrackerPage
        gameId={gameId}
        onBack={() => { setView('landing'); setGameId(null); }}
      />
    );
  }

  if (view === 'archive') {
    return (
      <GameArchivePage
        onBack={() => setView('landing')}
        onOpenGame={id => { setGameId(id); setView('tracker'); }}
      />
    );
  }

  if (view === 'newTemplate') {
    return (
      <NewTemplatePage
        onBack={() => setView('landing')}
        onCreated={() => setView('landing')}
      />
    );
  }

  if (view === 'newColumn') {
    return (
      <NewColumnPage
        onBack={() => setView('landing')}
      />
    );
  }

  if (view === 'editTemplate' && editTemplateId !== null) {
    return (
      <TemplateEditorPage
        templateId={editTemplateId}
        onBack={() => { setView('landing'); setEditTemplateId(null); }}
      />
    );
  }

  if (view === 'editLibraryCol' && editLibraryColId !== null) {
    return (
      <LibraryColumnEditorPage
        libraryColId={editLibraryColId}
        onBack={() => { setView('landing'); setEditLibraryColId(null); }}
      />
    );
  }

  return (
    <LandingPage
      onNewGame={id => { setGameId(id); setView('tracker'); }}
      onArchive={() => setView('archive')}
      onNewTemplate={() => setView('newTemplate')}
      onNewColumn={() => setView('newColumn')}
    />
  );
}
