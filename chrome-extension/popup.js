chrome.runtime.sendMessage({ type: 'get-status' }, (status) => {
  if (!status) return;

  const hudlDot = document.getElementById('hudl-dot');
  const hudlState = document.getElementById('hudl-state');
  const appDot = document.getElementById('app-dot');
  const appState = document.getElementById('app-state');
  const hint = document.getElementById('hint');

  hudlDot.className = `dot ${status.hudlConnected ? 'on' : 'off'}`;
  hudlState.className = `state ${status.hudlConnected ? 'on' : 'off'}`;
  hudlState.textContent = status.hudlConnected ? 'Connected' : 'Not found';

  appDot.className = `dot ${status.appConnected ? 'on' : 'off'}`;
  appState.className = `state ${status.appConnected ? 'on' : 'off'}`;
  appState.textContent = status.appConnected ? 'Connected' : 'Not found';

  if (status.hudlConnected && status.appConnected) {
    hint.innerHTML = '<strong style="color:#22c55e">Synced!</strong> Navigate clips in either tab — the other follows automatically.';
  } else if (!status.hudlConnected && !status.appConnected) {
    hint.innerHTML = 'Open <strong>Hudl</strong> and <strong>Assistant Coach</strong> in separate tabs to start syncing.';
  } else if (!status.hudlConnected) {
    hint.innerHTML = 'Open a <strong>Hudl cutup</strong> in another tab to connect.';
  } else {
    hint.innerHTML = 'Open <strong>hudldata.vercel.app</strong> in another tab to connect.';
  }
});
