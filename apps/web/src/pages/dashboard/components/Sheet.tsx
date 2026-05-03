interface SheetProps {
  isOpen: boolean;
  title: string;
  text: string;
  onClose: () => void;
  onEnter: () => void;
}

export default function Sheet({ isOpen, title, text, onClose, onEnter }: SheetProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20,
        background: 'rgba(34,29,24,0.22)',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'opacity 0.25s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <section
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          left: '12px',
          right: '12px',
          bottom: '12px',
          transform: isOpen ? 'translateY(0)' : 'translateY(110%)',
          background: '#f3eddf',
          border: '1px solid rgba(34,29,24,0.24)',
          boxShadow: '0 -20px 70px rgba(34,29,24,0.20)',
          padding: '22px 20px 20px',
          transition: 'transform 0.32s cubic-bezier(.2,.8,.2,1)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '10px',
            border: '1px solid rgba(34,29,24,0.08)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            width: '42px',
            height: '4px',
            background: 'rgba(34,29,24,0.18)',
            margin: '0 auto 20px',
          }}
        />

        <h2
          style={{
            margin: '0 0 12px',
            fontSize: '27px',
            fontWeight: 400,
            letterSpacing: '4px',
            color: '#221d18',
          }}
        >
          {title}
        </h2>

        <p
          style={{
            margin: '0 0 20px',
            color: '#5a5047',
            fontSize: '14px',
            lineHeight: '1.9',
            letterSpacing: '1px',
          }}
        >
          {text}
        </p>

        <div
          className="grid"
          style={{ gridTemplateColumns: '1fr 1fr', gap: '10px' }}
        >
          <button
            onClick={onClose}
            style={{
              height: '52px',
              border: '1px solid rgba(34,29,24,0.28)',
              background: 'transparent',
              fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
              fontSize: '15px',
              letterSpacing: '3px',
              color: '#221d18',
              cursor: 'pointer',
            }}
          >
            返回
          </button>
          <button
            onClick={onEnter}
            style={{
              height: '52px',
              border: '1px solid #221d18',
              background: '#221d18',
              fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
              fontSize: '15px',
              letterSpacing: '3px',
              color: '#f8f4ec',
              cursor: 'pointer',
            }}
          >
            进入
          </button>
        </div>
      </section>

      <style>{`
        @media (min-width: 768px) {
          section[style*="bottom: 12px"] {
            width: 406px !important;
            left: auto !important;
            right: auto !important;
            bottom: calc(50% - 414px) !important;
          }
        }
      `}</style>
    </div>
  );
}
