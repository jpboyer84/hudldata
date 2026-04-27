chrome.runtime.sendMessage({ type: 'get-status' }, (status) => {
  const hudlDot = document.getElementById('hudl-dot');
  const hudlState = document.getElementById('hudl-state');
  const appDot = document.getElementById('app-dot');
  const appState = document.getElementById('app-state');
  const roomCode = document.getElementById('room-code');

  if (status) {
    hudlDot.className = `dot ${status.hudlConnected ? 'on' : 'off'}`;
    hudlState.className = `state ${status.hudlConnected ? 'on' : 'off'}`;
    hudlState.textContent = status.hudlConnected ? 'Connected' : 'Not found';

    appDot.className = `dot ${status.appConnected ? 'on' : 'off'}`;
    appState.className = `state ${status.appConnected ? 'on' : 'off'}`;
    appState.textContent = status.appConnected ? 'Connected' : 'Not found';
  }
});

// Try to detect room code from active Hudl tab
chrome.tabs.query({ url: 'https://www.hudl.com/*' }, (tabs) => {
  const roomEl = document.getElementById('room-code');
  if (tabs && tabs.length > 0) {
    const url = tabs[0].url || '';
    const match = url.match(/\/(?:library|video\/\d+)\/(\d+)/);
    if (match) {
      roomEl.textContent = match[1];
      return;
    }
  }
  roomEl.textContent = 'Open Hudl to detect';
  roomEl.style.fontSize = '11px';
  roomEl.style.color = '#666';
});
