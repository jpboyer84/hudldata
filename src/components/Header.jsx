import { useNavigate } from 'react-router-dom';

export default function Header({ title, onBack, backLabel = '← Back', rightSlot }) {
  const navigate = useNavigate();

  function handleBack() {
    if (onBack) onBack();
    else navigate(-1);
  }

  return (
    <div className="hdr">
      <button className="hdr-btn" onClick={handleBack}>{backLabel}</button>
      <div className="hdr-title">{title}</div>
      {rightSlot || <div style={{ width: 60 }} />}
    </div>
  );
}
