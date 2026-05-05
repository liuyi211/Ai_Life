import type { Talent } from '../data';

interface StepTalentProps {
  drawnTalents: Talent[];
  selectedTalents: Talent[];
  drawing: boolean;
  onDraw: () => void;
  onRedraw: () => void;
  onToggle: (talent: Talent) => void;
}

export default function StepTalent({
  drawnTalents,
  selectedTalents,
  drawing,
  onDraw,
  onRedraw,
  onToggle,
}: StepTalentProps) {
  const hasDrawn = drawnTalents.length > 0;

  const isSelected = (talent: Talent) =>
    selectedTalents.some((t) => t.name === talent.name);

  // 上方3个卡槽的填充：先放已选中的，其余补"空位"
  const slots: (Talent | null)[] = [null, null, null];
  selectedTalents.forEach((t, i) => {
    if (i < 3) slots[i] = t;
  });

  return (
    <div className="flex flex-col h-full" style={{ animation: 'fadeUp .34s ease both' }}>
      <div className="flex justify-between items-end" style={{ marginBottom: '11px' }}>
        <span style={{ color: '#221d18', fontSize: '16px', letterSpacing: '3px' }}>天赋抽取</span>
        <span style={{ color: '#948879', fontSize: '13px', letterSpacing: '2px', fontStyle: 'italic' }}>Talent Oracle</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto" style={{ paddingRight: '3px' }}>
        <article
          className="relative"
          style={{
            border: '1px solid rgba(34,29,24,0.28)',
            background: 'linear-gradient(180deg, rgba(248,244,236,0.62), rgba(238,233,223,0.34)), radial-gradient(circle at 50% 10%, rgba(122,32,32,0.10), transparent 36%)',
            padding: '12px 13px 12px',
            marginBottom: '10px',
            overflow: 'hidden',
            boxShadow: '0 18px 58px rgba(34,29,24,0.09)',
          }}
        >
          <div
            className="absolute pointer-events-none"
            style={{ inset: '10px', border: '1px solid rgba(34,29,24,0.08)' }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              left: '50%',
              top: '46px',
              transform: 'translateX(-50%)',
              color: 'rgba(34,29,24,0.04)',
              fontSize: '34px',
              letterSpacing: '5px',
              whiteSpace: 'nowrap',
            }}
          >
            TALENT
          </div>

          <div
            className="relative grid place-items-center"
            style={{
              zIndex: 1,
              width: '86px',
              height: '86px',
              margin: '0 auto 9px',
              border: '1px solid rgba(122,32,32,0.30)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(248,244,236,0.56), rgba(122,32,32,0.05))',
              boxShadow: drawing
                ? '0 0 0 13px rgba(122,32,32,0.055), inset 0 0 34px rgba(122,32,32,0.15)'
                : '0 0 0 8px rgba(122,32,32,0.035), inset 0 0 26px rgba(159,124,62,0.10)',
              cursor: drawing ? 'default' : 'pointer',
              transition: '.3s ease',
              animation: drawing ? 'drawPulse .8s ease-in-out infinite' : 'none',
              transform: drawing ? 'scale(1.035)' : 'scale(1)',
            }}
            onClick={drawing ? undefined : hasDrawn ? onRedraw : onDraw}
          >
            <div
              className="absolute pointer-events-none"
              style={{ inset: '10px', borderRadius: '50%', border: '1px solid rgba(34,29,24,0.10)' }}
            />
            <div
              className="absolute pointer-events-none"
              style={{ inset: '23px', borderRadius: '50%', border: '1px solid rgba(122,32,32,0.13)' }}
            />
            <span
              style={{
                position: 'relative',
                zIndex: 1,
                color: '#7a2020',
                fontSize: '20px',
                letterSpacing: '3px',
              }}
            >
              {drawing ? '抽取中' : hasDrawn ? '重抽' : '抽取'}
            </span>
          </div>

          <div
            className="relative"
            style={{
              zIndex: 1,
              textAlign: 'center',
              color: '#948879',
              fontSize: '12px',
              letterSpacing: '1.5px',
              lineHeight: '1.55',
              marginBottom: '9px',
            }}
          >
            {hasDrawn
              ? '已抽取三项天赋。点击圆印可重新抽取，点击卡片可选择或取消。'
              : '点击圆印，命运池将显现三项候选天赋。'}
          </div>

          {/* 上方3个卡槽 */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '9px' }}>
            {slots.map((slot, i) => (
              <div
                key={i}
                style={{
                  minHeight: '44px',
                  border: slot
                    ? '1px solid rgba(122,32,32,0.34)'
                    : '1px dashed rgba(34,29,24,0.20)',
                  background: slot ? 'rgba(122,32,32,0.045)' : 'rgba(248,244,236,0.24)',
                  display: 'grid',
                  placeItems: 'center',
                  color: slot ? '#7a2020' : '#948879',
                  fontSize: '12px',
                  letterSpacing: '1px',
                  lineHeight: '1.35',
                  textAlign: 'center',
                  padding: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                {slot?.name || '空位'}
              </div>
            ))}
          </div>
        </article>

        {/* 下方详细天赋卡片 */}
        {hasDrawn && (
          <div className="grid" style={{ gap: '10px' }}>
            {drawnTalents.map((talent, i) => {
              const selected = isSelected(talent);
              return (
                <article
                  key={i}
                  onClick={() => onToggle(talent)}
                  className="relative"
                  style={{
                    border: selected
                      ? '1px solid rgba(122,32,32,0.34)'
                      : '1px solid rgba(34,29,24,0.13)',
                    padding: '13px 13px',
                    background: selected
                      ? 'rgba(122,32,32,0.04)'
                      : 'rgba(248,244,236,0.30)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    animation: 'cardReveal .34s ease both',
                    animationDelay: `${i * 0.1}s`,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '8px',
                      color: selected ? '#7a2020' : 'rgba(122,32,32,0.15)',
                      fontSize: selected ? '20px' : '18px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {selected ? '✦' : '✧'}
                  </div>
                  <div style={{ color: '#7a2020', fontSize: '11px', letterSpacing: '1.5px', marginBottom: '5px' }}>
                    {talent.rarity}
                  </div>
                  <h3
                    style={{
                      margin: '0 0 6px',
                      fontSize: '18px',
                      fontWeight: 400,
                      letterSpacing: '2px',
                      color: '#221d18',
                    }}
                  >
                    {talent.name}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: '#5a5047',
                      fontSize: '12px',
                      lineHeight: '1.65',
                      letterSpacing: '.6px',
                    }}
                  >
                    {talent.desc}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes drawPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 8px rgba(122,32,32,0.035), inset 0 0 26px rgba(159,124,62,0.10); }
          50% { transform: scale(1.035); box-shadow: 0 0 0 13px rgba(122,32,32,0.055), inset 0 0 34px rgba(122,32,32,0.15); }
        }
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
