interface ToastProps {
  text: string;
  visible: boolean;
}

export default function Toast({ text, visible }: ToastProps) {
  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '88px',
        transform: visible
          ? 'translateX(-50%) translateY(0)'
          : 'translateX(-50%) translateY(14px)',
        opacity: visible ? 1 : 0,
        zIndex: 30,
        pointerEvents: 'none',
        background: 'rgba(34,29,24,0.92)',
        color: '#f8f4ec',
        padding: '11px 17px',
        fontSize: '13px',
        letterSpacing: '2px',
        transition: 'all 0.24s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {text}

      <style>{`
        @media (min-width: 768px) {
          div[style*="bottom: 88px"] {
            bottom: calc(50% - 370px) !important;
          }
        }
      `}</style>
    </div>
  );
}
