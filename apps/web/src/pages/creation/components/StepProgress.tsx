import { STEP_META } from '../data';

interface StepProgressProps {
  step: number;
  onStepClick: (step: number) => void;
}

export default function StepProgress({ step, onStepClick }: StepProgressProps) {
  return (
    <nav
      className="grid"
      style={{
        gridTemplateColumns: 'repeat(5, 1fr)',
        borderTop: '1px solid rgba(34,29,24,0.13)',
        borderBottom: '1px solid rgba(34,29,24,0.13)',
        marginBottom: '12px',
      }}
    >
      {STEP_META.map((s, i) => {
        const isActive = i === step;
        const isDone = i < step;
        return (
          <button
            key={i}
            onClick={() => onStepClick(i)}
            className="relative"
            style={{
              padding: '11px 0 10px',
              borderRight: i < 4 ? '1px solid rgba(34,29,24,0.13)' : 'none',
              background: 'transparent',
              color: isActive ? '#7a2020' : isDone ? '#221d18' : '#948879',
              borderLeft: 'none',
              borderTop: 'none',
              borderBottom: 'none',
              fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: '13px',
                lineHeight: 1,
                marginBottom: '5px',
                letterSpacing: '1px',
              }}
            >
              {s.symbol}
            </span>
            <b
              style={{
                display: 'block',
                fontWeight: 400,
                fontSize: '11px',
                letterSpacing: '1px',
              }}
            >
              {s.label}
            </b>
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: '-1px',
                  width: '28px',
                  height: '1px',
                  transform: 'translateX(-50%)',
                  background: '#7a2020',
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
