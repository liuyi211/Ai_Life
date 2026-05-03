export default function Sigil() {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: '78px',
        left: '50%',
        width: '330px',
        height: '330px',
        transform: 'translateX(-50%)',
        border: '1px solid rgba(34,29,24,0.08)',
        borderRadius: '50%',
        zIndex: -1,
        animation: 'breathe 5.8s ease-in-out infinite',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '32px',
          borderRadius: '50%',
          border: '1px solid rgba(34,29,24,0.07)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '72px',
          borderRadius: '50%',
          border: '1px solid rgba(122,32,32,0.12)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          width: '1px',
          height: '100%',
          background: 'rgba(34,29,24,0.045)',
          transformOrigin: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(34,29,24,0.045)',
            transform: 'rotate(60deg)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(34,29,24,0.045)',
            transform: 'rotate(-60deg)',
          }}
        />
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { 
            transform: translateX(-50%) scale(1); 
            opacity: 0.82; 
          }
          50% { 
            transform: translateX(-50%) scale(1.035); 
            opacity: 1; 
          }
        }
      `}</style>
    </div>
  );
}
