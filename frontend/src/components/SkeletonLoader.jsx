export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-avatar" />
      <div className="skeleton-content">
        <div className="skeleton skeleton-line" style={{ width: '55%' }} />
        <div className="skeleton skeleton-line" style={{ width: '80%' }} />
        <div className="skeleton skeleton-line" style={{ width: '40%' }} />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 4 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonEmailViewer() {
  return (
    <div style={{ padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      <div className="skeleton skeleton-line" style={{ width: '70%', height: 24 }} />
      <div className="skeleton skeleton-line" style={{ width: '45%' }} />
      <div className="skeleton skeleton-line" style={{ width: '55%' }} />
      <div style={{ marginTop: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
        {[100, 90, 85, 70, 95, 60].map((w, i) => (
          <div key={i} className="skeleton skeleton-line" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}
