interface TopBarProps {
  mark: string;
  onSoulClick: () => void;
}

export default function TopBar({ mark, onSoulClick }: TopBarProps) {
  return (
    <header>
      <div
        className="flex justify-between items-start"
        style={{ marginBottom: '14px' }}
      >
        <div
          className="flex items-center"
          style={{
            gap: '12px',
            color: '#948879',
            fontSize: '15px',
            letterSpacing: '2px',
            fontStyle: 'italic',
          }}
        >
          <div style={{ width: '26px', height: '1px', background: 'rgba(34,29,24,0.35)' }} />
          {mark}
        </div>

        <button
          onClick={onSoulClick}
          className="relative grid place-items-center"
          style={{
            width: '52px',
            height: '64px',
            border: '1px solid rgba(34,29,24,0.28)',
            borderRadius: '999px 999px 22px 22px',
            background: 'rgba(248,244,236,0.38)',
            color: '#7a2020',
            fontSize: '16px',
            fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
            cursor: 'pointer',
            boxShadow: '0 12px 34px rgba(34,29,24,0.08)',
          }}
        >
          <div
            className="absolute"
            style={{
              inset: '7px',
              border: '1px solid rgba(122,32,32,0.16)',
              borderRadius: 'inherit',
            }}
          />
          印
        </button>
      </div>
    </header>
  );
}
