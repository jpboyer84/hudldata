import { useState } from 'react';
import NewGameModal from '../components/NewGameModal';

export default function LandingPage({ onNewGame, onArchive, onNewTemplate, onNewColumn }) {
  const [showGameModal, setShowGameModal] = useState(false);

  function handleGameCreated(id) {
    setShowGameModal(false);
    onNewGame(id);
  }

  const actions = [
    {
      key: 'newGame',
      label: 'NEW GAME',
      desc: 'Start tracking a new game',
      onClick: () => setShowGameModal(true),
      primary: true,
    },
    {
      key: 'archive',
      label: 'GAME ARCHIVE',
      desc: 'View and open past games',
      onClick: onArchive,
    },
    {
      key: 'newTemplate',
      label: 'NEW TEMPLATE',
      desc: 'Build a column template',
      onClick: onNewTemplate,
    },
    {
      key: 'newColumn',
      label: 'NEW COLUMN',
      desc: 'Add a column to the library',
      onClick: onNewColumn,
    },
  ];

  return (
    <div className="min-h-svh bg-bg flex flex-col">
      {/* Header */}
      <header className="px-6 py-6 flex-shrink-0" style={{ borderBottom: '1px solid #2a2a2a' }}>
        <div className="font-nunito font-black text-white text-3xl tracking-widest leading-none">
          HUDL DATA
        </div>
        <div className="text-white/25 text-[10px] font-mono tracking-widest mt-2">
          PLAY TRACKER
        </div>
      </header>

      {/* Four main action cards */}
      <main className="flex-1 p-5 grid grid-cols-2 gap-4 content-start">
        {actions.map(({ key, label, desc, onClick, primary }) => (
          <button
            key={key}
            onClick={onClick}
            className="flex flex-col items-start justify-end rounded-xl p-5 text-left transition-all active:scale-[0.97]"
            style={{
              backgroundColor: primary ? '#ffffff' : '#1e1e1e',
              border: primary ? 'none' : '1px solid #3a3a3a',
              minHeight: 140,
            }}
          >
            <div
              className="font-nunito font-black text-xl tracking-wide leading-tight mb-1"
              style={{ color: primary ? '#000000' : '#ffffff' }}
            >
              {label}
            </div>
            <div
              className="text-[11px] font-mono leading-relaxed"
              style={{ color: primary ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.3)' }}
            >
              {desc}
            </div>
          </button>
        ))}
      </main>

      {showGameModal && (
        <NewGameModal
          onClose={() => setShowGameModal(false)}
          onCreated={handleGameCreated}
        />
      )}
    </div>
  );
}
