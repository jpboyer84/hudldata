// Every icon is extracted verbatim from assistant-coach.html

export function LogoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M4 8L14 3L24 8V20L14 25L4 20V8Z" stroke="#fff" strokeWidth="2" fill="none"/>
      <path d="M14 3V25" stroke="#fff" strokeWidth="1.5" opacity="0.5"/>
      <path d="M4 8L14 13L24 8" stroke="#fff" strokeWidth="1.5" opacity="0.5"/>
      <path d="M14 13V25" stroke="#fff" strokeWidth="2"/>
    </svg>
  );
}

export function TagGameIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: 22, height: 22 }}>
      <rect x="3" y="4" width="14" height="12" rx="2" stroke="#e8590c" strokeWidth="1.5"/>
      <path d="M3 8H17" stroke="#e8590c" strokeWidth="1.5"/>
      <path d="M7 8V16" stroke="#e8590c" strokeWidth="1.5" opacity="0.5"/>
      <path d="M11 8V16" stroke="#e8590c" strokeWidth="1.5" opacity="0.5"/>
    </svg>
  );
}

export function StatsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: 22, height: 22 }}>
      <path d="M4 16V7" stroke="#e8590c" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 16V4" stroke="#e8590c" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 16V10" stroke="#e8590c" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 16V6" stroke="#e8590c" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function PlaybookIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: 22, height: 22 }}>
      <path d="M5 3H15V17H5V3Z" stroke="#e8590c" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 7H12M8 10H12M8 13H10" stroke="#e8590c" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    </svg>
  );
}

export function HudlConnectIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M7 10H13M13 10L10 7M13 10L10 13" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="10" cy="10" r="7" stroke="#555" strokeWidth="1.5"/>
    </svg>
  );
}

export function HudlConnectedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M7 10L9.5 12.5L13 7.5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="10" cy="10" r="7" stroke="#22c55e" strokeWidth="1.5"/>
    </svg>
  );
}

export function HelpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginBottom: 8 }}>
      <circle cx="10" cy="10" r="7" stroke="#555" strokeWidth="1.5"/>
      <circle cx="10" cy="7" r="1" fill="#555"/>
      <path d="M10 10V14" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function SettingsGearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginBottom: 8 }}>
      <circle cx="10" cy="10" r="3" stroke="#555" strokeWidth="1.5"/>
      <path d="M10 3V5M10 15V17M17 10H15M5 10H3" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function ChevronRight() {
  return (
    <svg className="lcard-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4L10 8L6 12" stroke="#444" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function GreenDot() {
  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%',
      background: '#22c55e', flexShrink: 0
    }} />
  );
}
