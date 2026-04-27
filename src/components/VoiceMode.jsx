import { useState, useRef, useCallback, useEffect } from 'react';

// ─── FOOTBALL SPEECH PARSER ─────────────────────────────────────

const DOWN_MAP = {
  'first': '1', '1st': '1', 'one': '1', '1': '1',
  'second': '2', '2nd': '2', 'two': '2', '2': '2',
  'third': '3', '3rd': '3', 'three': '3', '3': '3',
  'fourth': '4', '4th': '4', 'four': '4', '4': '4',
};

// Result patterns are defined inline in parseFootballSpeech() for ordered matching

const ODK_MAP = {
  'offense': 'O', 'offensive': 'O',
  'defense': 'D', 'defensive': 'D',
  'kicking': 'K', 'kick': 'K', 'special teams': 'K', 'special': 'K',
};

const NUM_WORDS = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  'twenty-one': 21, 'twenty-two': 22, 'twenty-three': 23, 'twenty-four': 24, 'twenty-five': 25,
  'thirty': 30, 'thirty-five': 35, 'forty': 40, 'forty-five': 45, 'fifty': 50,
};

function parseNumber(s) {
  if (!s) return null;
  const cleaned = s.trim().toLowerCase();
  if (NUM_WORDS[cleaned] !== undefined) return NUM_WORDS[cleaned];
  const n = parseInt(cleaned);
  return isNaN(n) ? null : n;
}

export function parseFootballSpeech(text) {
  const result = {};
  const t = text.toLowerCase().trim();

  // Commands
  if (/^(next\s*play|next|advance)$/i.test(t)) return { _command: 'next' };
  if (/^(previous|prev|back|go\s*back)$/i.test(t)) return { _command: 'prev' };
  if (/^(clear|clear\s*row|reset)$/i.test(t)) return { _command: 'clear' };
  if (/^(stop|stop\s*listening|exit|quit|done)$/i.test(t)) return { _command: 'stop' };

  // ODK
  for (const [phrase, val] of Object.entries(ODK_MAP)) {
    if (t.includes(phrase)) { result.odk = val; break; }
  }

  // Quarter: "quarter 2", "Q3", "2nd quarter", "quarter two"
  const qtrMatch = t.match(/(?:quarter|q)\s*(\d|one|two|three|four)|(\w+)\s+quarter/);
  if (qtrMatch) {
    const raw = qtrMatch[1] || qtrMatch[2];
    if (raw === '1' || raw === 'one' || raw === 'first' || raw === '1st') result.qtr = '1';
    else if (raw === '2' || raw === 'two' || raw === 'second' || raw === '2nd') result.qtr = '2';
    else if (raw === '3' || raw === 'three' || raw === 'third' || raw === '3rd') result.qtr = '3';
    else if (raw === '4' || raw === 'four' || raw === 'fourth' || raw === '4th') result.qtr = '4';
  }

  // Down and distance: "1st and 10", "2nd and 7", "third and goal", "2nd down and 10"
  // Also handles: "3rd n 7", "third in seven", "3 and 7", "third 7", "3rd, 7"
  const dnMatch = t.match(/(first|second|third|fourth|1st|2nd|3rd|4th|1|2|3|4)\s+(?:down\s+)?(?:and|n|in|&|,)\s*(\w+[\w-]*)/i)
    || t.match(/(first|second|third|fourth|1st|2nd|3rd|4th)\s+(\w+[\w-]*)\b/i);
  if (dnMatch) {
    const rawDn = dnMatch[1].toLowerCase();
    const dn = DOWN_MAP[rawDn];
    if (dn) {
      result.dn = dn;
      const rawDist = dnMatch[2].toLowerCase();
      if (rawDist === 'goal') result.dist2 = 'G';
      else {
        const dist = parseNumber(rawDist);
        if (dist !== null && dist <= 99) result.dist2 = String(dist);
      }
    }
  }

  // "X yards to go" / "X to go" for distance (standalone, when down already set or not)
  if (!result.dist2) {
    const toGoMatch = t.match(/(\w+[\w-]*)\s+(?:yards?\s+)?to\s+go/i);
    if (toGoMatch) {
      const rawDist = toGoMatch[1].toLowerCase();
      if (rawDist === 'goal') result.dist2 = 'G';
      else {
        const dist = parseNumber(rawDist);
        if (dist !== null && dist <= 99) result.dist2 = String(dist);
      }
    }
  }

  // Standalone down without "and": "2nd down"
  if (!result.dn) {
    const dnOnly = t.match(/(\w+)\s+down/);
    if (dnOnly && DOWN_MAP[dnOnly[1]]) result.dn = DOWN_MAP[dnOnly[1]];
  }

  // Yard line: "at own 20", "at the 35", "own 45", "their 30"
  const ylMatch = t.match(/(?:at\s+(?:the\s+)?)?(?:own\s+|our\s+|their\s+|opponent'?s?\s+)?(\d{1,2})\s*(?:yard\s*line)/);
  if (ylMatch) {
    const yl = parseInt(ylMatch[1]);
    if (yl >= 1 && yl <= 50) result.yardln = String(yl);
  }
  // Also try "at the 20" or "own 35" without "yard line"
  if (!result.yardln) {
    const ylShort = t.match(/(?:at\s+(?:the\s+)?|own\s+|our\s+)(\d{1,2})(?!\s*(?:yard\s+(?:gain|loss)|gain|loss))/);
    if (ylShort) {
      const yl = parseInt(ylShort[1]);
      if (yl >= 1 && yl <= 50) result.yardln = String(yl);
    }
  }

  // Hash
  if (/\b(?:left\s+hash|hash\s+left)\b/.test(t)) result.hash = 'L';
  else if (/\b(?:right\s+hash|hash\s+right)\b/.test(t)) result.hash = 'R';
  else if (/\b(?:middle\s+hash|hash\s+middle|middle)\b/.test(t)) result.hash = 'M';

  // Play type — check specific STK types BEFORE generic run/pass
  if (/\b(?:punt\s+return|punt\s+rec|returning?\s+(?:a\s+)?punt)\b/.test(t)) {
    result.playtype = 'Punt Rec'; if (!result.odk) result.odk = 'K';
  } else if (/\b(?:kick\s*off?\s+return|kick\s+return|ko\s+rec|returning?\s+(?:a\s+)?kick)\b/.test(t)) {
    result.playtype = 'KO Rec'; if (!result.odk) result.odk = 'K';
  } else if (/\b(?:onside\s+kick)\b/.test(t)) {
    result.playtype = /\brec/.test(t) ? 'Onside Kick Rec' : 'Onside Kick'; if (!result.odk) result.odk = 'K';
  } else if (/\b(?:fake\s+punt)\b/.test(t)) {
    result.playtype = 'Fake Punt'; if (!result.odk) result.odk = 'K';
  } else if (/\b(?:fake\s+field\s+goal|fake\s+fg)\b/.test(t)) {
    result.playtype = 'Fake FG'; if (!result.odk) result.odk = 'K';
  } else if (/\b(?:field\s+goal|fg)\b/.test(t)) {
    result.playtype = /\bblock/.test(t) ? 'FG Block' : 'FG'; if (!result.odk) result.odk = 'K';
  } else if (/\b(?:extra\s+point|pat)\b/.test(t)) {
    result.playtype = /\bblock/.test(t) ? 'Extra Pt. Block' : 'Extra Pt.'; if (!result.odk) result.odk = 'K';
  } else if (/\b(?:two\s+point|2\s+point)\b/.test(t)) {
    result.playtype = /\bdefend/.test(t) ? '2 Pt. Defend' : '2 Pt.'; if (!result.odk) result.odk = 'K';
  } else if (/\b(?:kick\s*off|ko)\b/.test(t)) {
    result.playtype = 'KO'; if (!result.odk) result.odk = 'K';
  } else if (/\bpunt\b/.test(t) && !/\bfake/.test(t)) {
    result.playtype = 'Punt'; if (!result.odk) result.odk = 'K';
  } else if (/\b(?:run|rush|rushing|carry|ran)\b/.test(t)) {
    result.playtype = 'Run';
  } else if (/\b(?:pass|passing|threw|throw|thrown)\b/.test(t)) {
    result.playtype = 'Pass';
  }

  // Play direction
  const dirMatch = t.match(/\b(?:run|rush|pass)\s+(left|right)\b/);
  if (dirMatch && !result.hash) result.playdir = dirMatch[1] === 'left' ? 'L' : 'R';

  // Result — compound patterns first, then simple. Ordered so longer matches win.
  const RESULT_PATTERNS = [
    // Compound results (must be before simple versions)
    [/\b(?:rush\s+td|rushing\s+touchdown)\b/, 'Rush TD'],
    [/\b(?:complete\s+td|passing\s+touchdown|pass\s+td)\b/, 'Complete TD'],
    [/\b(?:complete\s+fumble)\b/, 'Complete Fumble'],
    [/\b(?:scramble\s+td)\b/, 'Scramble TD'],
    [/\b(?:sack\s+fumble)\b/, 'Sack Fumble'],
    [/\b(?:sack\s+safety)\b/, 'Sack Safety'],
    [/\b(?:rush\s+safety)\b/, 'Rush Safety'],
    [/\b(?:interception\s+fumble)\b/, 'Interception Fumble'],
    [/\b(?:extra\s+point\s+block|pat\s+block)\b/, 'Extra Pt. Block'],
    // Simple results
    [/\b(?:incomplete|incompletion|in\s+complete)\b/, 'Incomplete'],
    [/\bdropped\b/, 'Incomplete'],
    [/\b(?:complete|completion|caught)\b/, 'Complete'],
    [/\b(?:interception|intercepted)\b/, 'Interception'],
    [/\bpick\b/, 'Interception'],
    [/\b(?:scramble|scrambled)\b/, 'Scramble'],
    [/\b(?:sack|sacked)\b/, 'Sack'],
    [/\b(?:fumble|fumbled)\b/, 'Fumble'],
    [/\b(?:touchdown|td)\b/, 'TD'],
    [/\b(?:penalty|flag)\b/, 'Penalty'],
    [/\b(?:fair\s+catch)\b/, 'Fair Catch'],
    [/\btouchback\b/, 'Touchback'],
    [/\b(?:out\s+of\s+bounds)\b/, 'Out of Bounds'],
    [/\b(?:batted\s+down|bat\s+down)\b/, 'Batted Down'],
    [/\bsafety\b/, 'Safety'],
    [/\b(?:first\s+down|1st\s+down)\b/, '1st DN'],
    [/\bdowned\b/, 'Downed'],
    [/\b(?:good|made\s+it)\b/, 'Good'],
    [/\b(?:no\s+good|missed|miss)\b/, 'No Good'],
    [/\breturn\b/, 'Return'],
    [/\brecovered\b/, 'Recovered'],
    [/\btimeout\b/, 'Timeout'],
  ];
  for (const [rx, val] of RESULT_PATTERNS) {
    if (rx.test(t)) { result.result = val; break; }
  }
  if (/\bno\s+gain\b/.test(t)) result.result = result.result || 'No Gain';

  // Gain/Loss
  const gainMatch = t.match(/gain\s+of\s+(\w+)|(\w+)\s+yard\s+gain/);
  if (gainMatch) {
    const n = parseNumber(gainMatch[1] || gainMatch[2]);
    if (n !== null) result.gainloss = String(n);
  }
  const lossMatch = t.match(/loss\s+of\s+(\w+)|(\w+)\s+yard\s+loss/);
  if (lossMatch) {
    const n = parseNumber(lossMatch[1] || lossMatch[2]);
    if (n !== null) result.gainloss = String(-n);
  }
  if (/\bno\s+gain\b/.test(t)) result.gainloss = '0';

  return result;
}

// ─── VOICE MODE COMPONENT ─────────────────────────────────────

export default function VoiceMode({ onValues, onCommand, active, onToggle }) {
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState(null);
  const recognitionRef = useRef(null);
  const restartTimer = useRef(null);
  const stoppedRef = useRef(false);

  const hasSpeechAPI = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback(() => {
    if (!hasSpeechAPI || stoppedRef.current) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Single utterance mode — prevents feedback loop
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript?.trim();
      if (!text) return;

      setTranscript(text);
      const result = parseFootballSpeech(text);

      if (result._command) {
        if (result._command === 'stop') {
          stoppedRef.current = true;
          onToggle(); // Turn off voice mode
          return;
        }
        onCommand(result._command);
        setParsed({ command: result._command });
        setTimeout(() => setParsed(null), 1500);
      } else if (Object.keys(result).length > 0) {
        onValues(result);
        setParsed(result);
        setTimeout(() => setParsed(null), 2500);
      }

      // Clear transcript after a beat
      setTimeout(() => setTranscript(''), 2500);
    };

    recognition.onerror = (event) => {
      // Ignore common non-errors
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.log('[Voice] Error:', event.error);
    };

    recognition.onend = () => {
      // Auto-restart after a pause — the delay prevents feedback loop
      if (active && !stoppedRef.current) {
        restartTimer.current = setTimeout(() => {
          if (active && !stoppedRef.current) {
            try { startListening(); } catch {}
          }
        }, 1500); // 1.5s pause between listens
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch {}
  }, [active, hasSpeechAPI, onValues, onCommand, onToggle]);

  useEffect(() => {
    if (active) {
      stoppedRef.current = false;
      startListening();
    } else {
      stoppedRef.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      if (restartTimer.current) {
        clearTimeout(restartTimer.current);
        restartTimer.current = null;
      }
      setTranscript('');
      setParsed(null);
    }
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (restartTimer.current) clearTimeout(restartTimer.current);
    };
  }, [active, startListening]);

  if (!hasSpeechAPI || !active) return null;

  return (
    <div style={{
      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: 10, padding: '8px 12px', margin: '0 10px 8px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 10, height: 10, borderRadius: 5, background: '#ef4444', flexShrink: 0,
        animation: 'voicePulse 1.5s ease-in-out infinite',
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {transcript ? (
          <div style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500 }}>
            "{transcript}"
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            Listening… say play data or "next play"
          </div>
        )}
        {parsed && !parsed.command && (
          <div style={{ fontSize: 10, color: 'var(--color-accent)', marginTop: 2 }}>
            {Object.entries(parsed).map(([k, v]) => `${k.toUpperCase()}=${v}`).join(' · ')}
          </div>
        )}
        {parsed?.command && (
          <div style={{ fontSize: 10, color: '#22c55e', marginTop: 2 }}>
            → {parsed.command.toUpperCase()}
          </div>
        )}
      </div>

      <button
        onClick={onToggle}
        style={{
          background: '#ef4444', border: 'none', borderRadius: 6,
          color: '#fff', fontSize: 11, fontWeight: 700, padding: '6px 10px',
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        STOP
      </button>

      <style>{`
        @keyframes voicePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}


