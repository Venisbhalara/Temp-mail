// Speech-bubble illustration matching the reference image
function BubbleIllustration() {
  return (
    <svg
      width="90" height="80"
      viewBox="0 0 90 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Primary (larger) bubble */}
      <circle cx="38" cy="34" r="30"
        fill="var(--bg-elevated)"
        stroke="var(--border-strong)"
        strokeWidth="2"
      />
      {/* Minus / dash line inside primary bubble */}
      <line x1="26" y1="34" x2="50" y2="34"
        stroke="var(--text-muted)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Speech bubble tail */}
      <path
        d="M30 62 Q28 72 20 76 Q32 74 38 64"
        fill="var(--bg-elevated)"
        stroke="var(--border-strong)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Secondary (smaller) overlapping bubble */}
      <circle cx="62" cy="52" r="22"
        fill="var(--bg-elevated)"
        stroke="var(--border-strong)"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function EmptyState({ icon = '📭', title, subtitle, action }) {
  const isBubble = icon === 'bubble';

  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        {isBubble ? (
          <BubbleIllustration />
        ) : (
          <div style={{
            width: 72, height: 72,
            borderRadius: '50%',
            background: 'var(--bg-elevated)',
            border: '2px solid var(--border-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
          }}>
            {icon}
          </div>
        )}
      </div>

      <p className="empty-state__title">{title}</p>

      {subtitle && (
        <p className="empty-state__sub">
          {isBubble && (
            <span className="empty-state__sub-icon">
              {/* Rotating arrows icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="var(--text-muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </span>
          )}
          {subtitle}
        </p>
      )}

      {action}
    </div>
  );
}
