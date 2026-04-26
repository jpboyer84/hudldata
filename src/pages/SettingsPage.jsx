import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { fetchGames, fetchTemplates, fetchColumns, createGame, createTemplate, createColumn } from '../lib/supaData';
import Header from '../components/Header';
import HudlLoginModal from '../components/HudlLoginModal';
import ConfirmModal from '../components/ConfirmModal';
import { getCacheStats, clearHudlCache } from '../lib/hudlCache';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { coach, signOut, disconnectHudl } = useAuth();
  const showToast = useToast();
  const [hudlModalOpen, setHudlModalOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
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
        {/* Help / FAQ */}
        <div className="settings-group">
          <div className="settings-group-title">❓ Help</div>
          <div className="settings-row">
            <div className="settings-btn" onClick={() => navigate('/help')}>
              <span className="settings-btn-icon">📖</span>
              Help & FAQ
              <span className="settings-btn-label">How-to guides & Ask AI</span>
            </div>
          </div>
        </div>

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

        {/* Hudl cache (#22-23) */}
        <div className="settings-group">
          <div className="settings-group-title">Hudl cache</div>
          <div className="settings-group-sub">
            {(() => {
              const stats = getCacheStats();
              return stats.count > 0
                ? `${stats.count} cutups cached (${stats.totalClips} clips, ${(stats.totalSize / 1024).toFixed(0)} KB)`
                : 'No cached data';
            })()}
          </div>
          <div className="settings-row">
            <div className="settings-btn" onClick={() => { clearHudlCache(); showToast('Cache cleared'); }}>
              <span className="settings-btn-icon">🗑</span>
              Clear cache
              <span className="settings-btn-label">Force fresh data from Hudl</span>
            </div>
          </div>
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
