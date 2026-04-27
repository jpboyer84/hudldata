import { useState, useRef, useCallback, useEffect } from 'react';

// ─── FOOTBALL SPEECH PARSER ─────────────────────────────────────
// Converts spoken text into column values for the tracker

const DOWN_MAP = {
  'first': '1', '1st': '1', 'one': '1',
  'second': '2', '2nd': '2', 'two': '2',
  'third': '3', '3rd': '3', 'three': '3',
  'fourth': '4', '4th': '4', 'four': '4',
};

const RESULT_MAP = {
  'complete': 'Complete', 'completion': 'Complete', 'caught': 'Complete',
  'incomplete': 'Incomplete', 'incompletion': 'Incomplete', 'dropped': 'Incomplete', 'overthrown': 'Incomplete',
  'sack': 'Sack', 'sacked': 'Sack',
  'scramble': 'Scramble', 'scrambled': 'Scramble',
  'fumble': 'Fumble', 'fumbled': 'Fumble',
  'interception': 'Interception', 'intercepted': 'Interception', 'pick': 'Interception', 'picked': 'Interception',
  'touchdown': 'TD', 'td': 'TD',
  'penalty': 'Penalty', 'flag': 'Penalty',
  'no gain': 'No Gain',
};

const ODK_MAP = {
  'offense': 'O', 'offensive': 'O',
  'defense': 'D', 'defensive': 'D',
  'kicking': 'K', 'kick': 'K', 'special teams': 'K', 'special': 'K',
};

const QTR_MAP = {
  'first quarter': '1', 'quarter 1': '1', 'q1': '1', '1st quarter': '1',
  'second quarter': '2', 'quarter 2': '2', 'q2': '2', '2nd quarter': '2',
  'third quarter': '3', 'quarter 3': '3', 'q3': '3', '3rd quarter': '3',
  'fourth quarter': '4', 'quarter 4': '4', 'q4': '4', '4th quarter': '4',
  'overtime': 'OT',
};

// Number word → digit
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

  // Commands (not column values)
  if (/^(next\s*play|next|advance)$/i.test(t)) {
    return { _command: 'next' };
  }
  if (/^(previous|prev|back|go\s*back)$/i.test(t)) {
    return { _command: 'prev' };
  }
  if (/^(clear|clear\s*row|reset)$/i.test(t)) {
    return { _command: 'clear' };
  }
  if (/^(undo|undo\s*that)$/i.test(t)) {
    return { _command: 'undo' };
  }
  if (/^(stop|stop\s*listening|exit|quit|done)$/i.test(t)) {
    return { _command: 'stop' };
  }

  // ODK
  for (const [phrase, val] of Object.entries(ODK_MAP)) {
    if (t.includes(phrase)) { result.odk = val; break; }
  }

  // Quarter
  for (const [phrase, val] of Object.entries(QTR_MAP)) {
    if (t.includes(phrase)) { result.qtr = val; break; }
  }

  // Down and distance: "1st and 10", "third and 7", "second and goal"
  const dnMatch = t.match(/(\w+)\s+and\s+(\w+)/);
  if (dnMatch) {
    const dn = DOWN_MAP[dnMatch[1]];
    if (dn) {
      result.dn = dn;
      if (dnMatch[2] === 'goal') {
        result.dist2 = 'G';
      } else {
        const dist = parseNumber(dnMatch[2]);
        if (dist !== null) result.dist2 = String(dist);
      }
    }
  }

  // Yard line: "at own 20", "at the 35", "own 45", "their 30", "at the own 20"
  const ylMatch = t.match(/(?:at\s+(?:the\s+)?)?(?:own\s+|our\s+|their\s+|opponent'?s?\s+)?(\d{1,2})\s*(?:yard\s*line)?/);
  if (ylMatch && !t.match(/gain|loss|yard\s+gain|yard\s+loss/)) {
    // Only set yard line if it's not part of a gain/loss phrase
    const yl = parseInt(ylMatch[1]);
    if (yl >= 1 && yl <= 50) {
      result.yardln = String(yl);
    }
  }

  // Hash: "left hash", "right hash", "middle", "left", "right"
  if (/\b(left\s+hash|hash\s+left)\b/.test(t)) result.hash = 'L';
  else if (/\b(right\s+hash|hash\s+right)\b/.test(t)) result.hash = 'R';
  else if (/\b(middle\s+hash|hash\s+middle|middle)\b/.test(t)) result.hash = 'M';
  // Simple left/right only if "hash" is also mentioned or no other context
  else if (/\bleft\b/.test(t) && /\bhash\b/.test(t)) result.hash = 'L';
  else if (/\bright\b/.test(t) && /\bhash\b/.test(t)) result.hash = 'R';

  // Play type
  if (/\b(run|rush|rushing|carry|ran)\b/.test(t)) result.playtype = 'Run';
  else if (/\b(pass|passing|threw|throw|thrown)\b/.test(t)) result.playtype = 'Pass';

  // Play direction (only if not hash context)
  if (!result.hash) {
    if (/\b(run|rush|pass)\s+(left)\b/.test(t)) result.playdir = 'L';
    else if (/\b(run|rush|pass)\s+(right)\b/.test(t)) result.playdir = 'R';
  }

  // Result
  for (const [phrase, val] of Object.entries(RESULT_MAP)) {
    if (t.includes(phrase)) { result.result = val; break; }
  }

  // Gain/Loss: "gain of 5", "5 yard gain", "loss of 3", "3 yard loss", "no gain"
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

  // Standalone number at end could be gain/loss if play type was mentioned
  if (!result.gainloss && (result.playtype || result.result)) {
    const trailingNum = t.match(/\b(\d{1,2})\s*$/);
    if (trailingNum) {
      result.gainloss = trailingNum[1];
    }
  }

  return result;
}

// ─── VOICE MODE COMPONENT ─────────────────────────────────────

export default function VoiceMode({ onValues, onCommand, active, onToggle }) {
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const restartTimeout = useRef(null);

  const hasSpeechAPI = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback(() => {
    if (!hasSpeechAPI) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }

      if (interim) setTranscript(interim);

      if (final) {
        const trimmed = final.trim();
        setTranscript(trimmed);
        const result = parseFootballSpeech(trimmed);

        if (result._command) {
          onCommand(result._command);
          setParsed({ command: result._command });
          // Clear after showing briefly
          setTimeout(() => { setTranscript(''); setParsed(null); }, 1200);
        } else if (Object.keys(result).length > 0) {
          onValues(result);
          setParsed(result);
          // Clear transcript after a beat
          setTimeout(() => { setTranscript(''); }, 2000);
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      setError(`Error: ${event.error}`);
    };

    recognition.onend = () => {
      // Auto-restart if still in voice mode
      if (active) {
        restartTimeout.current = setTimeout(() => {
          try { recognition.start(); } catch {}
        }, 300);
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch {}
  }, [active, hasSpeechAPI, onValues, onCommand]);

  useEffect(() => {
    if (active) {
      startListening();
    } else {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      if (restartTimeout.current) {
        clearTimeout(restartTimeout.current);
      }
      setTranscript('');
      setParsed(null);
    }
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (restartTimeout.current) {
        clearTimeout(restartTimeout.current);
      }
    };
  }, [active, startListening]);

  if (!hasSpeechAPI) return null;

  // Compact bar when active
  if (active) {
    return (
      <div style={{
        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: 10, padding: '8px 12px', margin: '0 10px 8px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {/* Pulsing dot */}
        <div style={{
          width: 10, height: 10, borderRadius: 5, background: '#ef4444', flexShrink: 0,
          animation: 'pulse 1.5s ease-in-out infinite',
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
            <div style={{ fontSize: 10, color: 'var(--color-green, #22c55e)', marginTop: 2 }}>
              → {parsed.command.toUpperCase()}
            </div>
          )}
          {error && <div style={{ fontSize: 10, color: 'var(--color-red)' }}>{error}</div>}
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
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.8); }
          }
        `}</style>
      </div>
    );
  }

  return null;
}
