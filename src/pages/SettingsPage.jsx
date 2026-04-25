import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { fetchGames, fetchTemplates, fetchColumns, createGame, createTemplate, createColumn } from '../lib/supaData';
import Header from '../components/Header';
import HudlLoginModal from '../components/HudlLoginModal';
import ConfirmModal from '../components/ConfirmModal';

const FAQ = [
  { q: 'How do I track a game?', a: 'Tap "Tag a game" → "+ New" to start fresh, or "Load from Hudl" to pull in a cutup. Tag each play with the column buttons, then tap "Next play →" to advance.' },
  { q: 'How do I load data from Hudl?', a: 'Connect to Hudl below, then tap "Tag a game" → "Load from Hudl". Browse your cutups, tap one, and all play data maps to your columns automatically.' },
  { q: 'How do I send data back to Hudl?', a: 'When viewing a Hudl-loaded game, tap the green "▲ Send" button in the header or find it in the ⋯ menu.' },
  { q: 'How do I use the AI assistant?', a: 'Go to Stats → ASK AI tab with a game selected. Ask questions like "What\'s our 3rd down conversion rate?" or "Which formation gains the most yards?"' },
  { q: 'How do I export my data?', a: 'From the tracker: ⋯ → Export XLSX. From Archive: Select mode → pick games → EXPORT. Or use the backup section above for a full JSON export.' },
  { q: 'How do I invite other coaches?', a: 'Share your 6-character invite code (shown above). They sign up, choose "Join a team", and enter the code.' },
  { q: 'How do templates work?', a: 'Templates define which columns appear in the tracker. Go to Templates above to create or edit them. Pick your template when starting a new game.' },
];

function FAQItem({ q, a, openFaq, setOpenFaq, idx }) {
  const isOpen = openFaq === idx;
  return (
    <div style={{
      background: 'var(--color-bg)', border: '1px solid var(--color-border)',
      borderRadius: 10, marginBottom: 6, overflow: 'hidden',
    }}>
      <div
        onClick={() => setOpenFaq(isOpen ? null : idx)}
        style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div style={{ fontSize: 13, fontWeight: 600 }}>{q}</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>▾</div>
      </div>
      {isOpen && (
        <div style={{ padding: '0 14px 12px', fontSize: 12, color: 'var(--color-muted2)', lineHeight: 1.7 }}>{a}</div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { coach, signOut, disconnectHudl } = useAuth();
  const showToast = useToast();
  const [hudlModalOpen, setHudlModalOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const fileRef = useRef(null);

  const hudlConnected = !!coach?.hudl_cookie;

  async function handleDisconnectHudl() {
    await disconnectHudl();
    showToast('Disconnected from Hudl');
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  // ─── EXPORT BACKUP ───
  async function handleExportJSON() {
    if (!coach?.team_id) { showToast('No team found'); return; }
    try {
      showToast('Building backup…');
      const [games, templates, columns] = await Promise.all([
        fetchGames(coach.team_id),
        fetchTemplates(coach.team_id),
        fetchColumns(coach.team_id),
      ]);
      const backup = {
        version: 2,
        exported_at: new Date().toISOString(),
        team: coach.teams || {},
        games,
        templates,
        columns,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assistant-coach-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Exported ${games.length} games, ${templates.length} templates, ${columns.length} columns`);
    } catch (err) {
      showToast('Export failed: ' + err.message);
    }
  }

  // ─── IMPORT BACKUP ───
  function handleImportClick() {
    fileRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // Reset so same file can be re-selected

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.games && !data.templates && !data.columns) {
        showToast('Invalid backup file');
        return;
      }

      let imported = { games: 0, templates: 0, columns: 0 };

      if (data.columns && Array.isArray(data.columns)) {
        for (const col of data.columns) {
          try {
            await createColumn({ ...col, id: undefined, team_id: coach.team_id });
            imported.columns++;
          } catch {}
        }
      }

      if (data.templates && Array.isArray(data.templates)) {
        for (const tmpl of data.templates) {
          try {
            await createTemplate({ ...tmpl, id: undefined, team_id: coach.team_id });
            imported.templates++;
          } catch {}
        }
      }

      if (data.games && Array.isArray(data.games)) {
        for (const game of data.games) {
          try {
            await createGame({
              ...game,
              id: undefined,
              team_id: coach.team_id,
              created_by: coach.id,
            });
            imported.games++;
          } catch {}
        }
      }

      showToast(`Imported ${imported.games} games, ${imported.templates} templates, ${imported.columns} columns`);
    } catch (err) {
      showToast('Import failed: ' + err.message);
    }
  }

  return (
    <div className="view">
      <Header title="Settings & Help" onBack={() => navigate('/')} />

      <div className="settings-body">
        {/* Team info */}
        {coach?.teams && (
          <div className="settings-group">
            <div className="settings-group-title">🏈 Your Team</div>
            <div style={{
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              borderRadius: 12, padding: 16, marginTop: 8,
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                {coach.teams.name || 'My Team'}
              </div>
              {coach.teams.school && (
                <div style={{ fontSize: 13, color: 'var(--color-muted2)', marginBottom: 2 }}>
                  {coach.teams.school}
                </div>
              )}
              {(coach.teams.city || coach.teams.state) && (
                <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                  {[coach.teams.city, coach.teams.state].filter(Boolean).join(', ')}
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 10, borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
                Invite code: <span style={{ fontFamily: 'monospace', color: 'var(--color-muted2)', userSelect: 'all', fontSize: 16, fontWeight: 700, letterSpacing: '0.1em' }}>{coach.teams.invite_code || coach.team_id}</span>
              </div>
            </div>
          </div>
        )}

        {/* Backup */}
        <div className="settings-group">
          <div className="settings-group-title">💾 Save Full Backup</div>
          <div className="settings-group-sub">
            Save all your games, templates, and columns as a JSON file.
          </div>
          <div className="settings-row">
            <div className="settings-btn" onClick={handleExportJSON}>
              <span className="settings-btn-icon">📁</span>
              SAVE TO DEVICE
              <span className="settings-btn-label">Download JSON file</span>
            </div>
          </div>
        </div>

        {/* Restore */}
        <div className="settings-group">
          <div className="settings-group-title">📥 Restore Full Backup</div>
          <div className="settings-group-sub">
            Load a previously saved backup to import games, templates, and columns.
          </div>
          <div className="settings-row">
            <div className="settings-btn" onClick={handleImportClick}>
              <span className="settings-btn-icon">📁</span>
              FROM DEVICE
              <span className="settings-btn-label">Choose JSON file</span>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {/* Templates & columns */}
        <div className="settings-group">
          <div className="settings-group-title">Templates & columns</div>
          <div className="settings-group-sub">
            Manage your tracker templates and custom columns.
          </div>
          <div className="settings-row">
            <div className="settings-btn" onClick={() => navigate('/templates')}>
              <span className="settings-btn-icon">📐</span>
              Templates
            </div>
            <div className="settings-btn" onClick={() => navigate('/columns')}>
              <span className="settings-btn-icon">📋</span>
              Columns
            </div>
          </div>
        </div>

        {/* Hudl connection */}
        <div className="settings-group">
          <div className="settings-group-title">Hudl connection</div>
          <div className="settings-group-sub">
            {hudlConnected
              ? `Connected as ${coach?.hudl_team_name || 'your team'}`
              : 'Not connected — using default server session.'
            }
          </div>
          {!hudlConnected ? (
            <div className="settings-row">
              <div className="settings-btn" onClick={() => setHudlModalOpen(true)}>
                <span className="settings-btn-icon">🔗</span>
                Connect to Hudl
                <span className="settings-btn-label">Login with your account</span>
              </div>
            </div>
          ) : (
            <div className="settings-row">
              <div
                className="settings-btn"
                onClick={handleDisconnectHudl}
                style={{ borderColor: '#e74c3c' }}
              >
                <span className="settings-btn-icon">✕</span>
                Disconnect
                <span className="settings-btn-label">Remove saved session</span>
              </div>
            </div>
          )}
        </div>

        {/* Account */}
        <div className="settings-group">
          <div className="settings-group-title">Account</div>
          <div className="settings-group-sub">
            Signed in as {coach?.email || 'unknown'}
          </div>
          <div className="settings-row">
            <div
              className="settings-btn"
              onClick={() => setConfirmSignOut(true)}
              style={{ borderColor: '#e74c3c', color: '#e74c3c' }}
            >
              <span className="settings-btn-icon">🚪</span>
              Sign out
            </div>
          </div>
        </div>

        {/* Help / FAQ */}
        <div className="settings-group">
          <div className="settings-group-title">❓ Help</div>
          {FAQ.map((f, i) => (
            <FAQItem key={i} q={f.q} a={f.a} openFaq={openFaq} setOpenFaq={setOpenFaq} idx={i} />
          ))}
        </div>
      </div>

      <HudlLoginModal open={hudlModalOpen} onClose={() => setHudlModalOpen(false)} />
      <ConfirmModal
        open={confirmSignOut}
        title="Sign out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign out"
        danger
        onConfirm={handleSignOut}
        onCancel={() => setConfirmSignOut(false)}
      />
    </div>
  );
}
