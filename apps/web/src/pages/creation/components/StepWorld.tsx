import type { CreationForm } from '../data';
import { useWorldStore, type WorldData } from '../../../stores/worldStore';

interface StepWorldProps {
  form: CreationForm;
  onChange: (updates: Partial<CreationForm>) => void;
}

export default function StepWorld({ form, onChange }: StepWorldProps) {
  const allWorlds = useWorldStore((state) => state.allWorlds);

  return (
    <div className="flex flex-col h-full" style={{ animation: 'fadeUp .34s ease both' }}>
      <div className="flex justify-between items-end" style={{ marginBottom: '11px' }}>
        <span style={{ color: '#221d18', fontSize: '16px', letterSpacing: '3px' }}>选择世界</span>
        <span style={{ color: '#948879', fontSize: '13px', letterSpacing: '2px', fontStyle: 'italic' }}>World Archive</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto" style={{ paddingRight: '3px' }}>
        {allWorlds.map((world) => (
          <WorldCard
            key={world.id}
            world={world}
            selected={form.world === world.id}
            currentConfig={form.worldConfig}
            onSelect={() => onChange({ world: world.id, worldConfig: world.configOptions[0] })}
            onConfigChange={(config) => onChange({ worldConfig: config })}
          />
        ))}
      </div>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

function WorldCard({
  world,
  selected,
  currentConfig,
  onSelect,
  onConfigChange,
}: {
  world: WorldData;
  selected: boolean;
  currentConfig: string;
  onSelect: () => void;
  onConfigChange: (config: string) => void;
}) {
  return (
    <article
      onClick={onSelect}
      className="relative"
      style={{
        border: '1px solid',
        borderColor: selected ? 'rgba(122,32,32,0.46)' : 'rgba(34,29,24,0.28)',
        background: selected
          ? 'rgba(122,32,32,0.045)'
          : 'linear-gradient(180deg, rgba(248,244,236,0.58), rgba(238,233,223,0.34)), radial-gradient(circle at 50% 10%, rgba(159,124,62,0.13), transparent 35%)',
        padding: '13px 13px 12px',
        marginBottom: '9px',
        overflow: 'hidden',
        boxShadow: '0 10px 32px rgba(34,29,24,0.06)',
        cursor: 'pointer',
        transition: '.24s ease',
        transform: selected ? 'translateX(3px)' : 'translateX(0)',
      }}
    >
      <div
        className="absolute pointer-events-none"
        style={{ inset: '8px', border: '1px solid rgba(34,29,24,0.08)' }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          right: '10px',
          top: '4px',
          color: 'rgba(34,29,24,0.045)',
          fontSize: '38px',
          lineHeight: 1,
        }}
      >
        {world.mark}
      </div>

      <div
        className="relative flex justify-between items-start"
        style={{ zIndex: 1, gap: '16px', marginBottom: '12px' }}
      >
        <span
          style={{
            color: '#7a2020',
            fontSize: '11px',
            letterSpacing: '1.5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#7a2020',
              boxShadow: '0 0 0 7px rgba(122,32,32,0.07)',
            }}
          />
          {world.tag}
        </span>
        <span
          style={{
            color: '#948879',
            fontSize: '12px',
            letterSpacing: '2px',
            textAlign: 'right',
            whiteSpace: 'nowrap',
          }}
        >
          {world.tagEn}
        </span>
      </div>

      <h2
        className="relative"
        style={{
          zIndex: 1,
          margin: '0 0 6px',
          fontWeight: 400,
          fontSize: '22px',
          letterSpacing: '3px',
          color: '#221d18',
        }}
      >
        {world.name}
      </h2>

      <p
        className="relative"
        style={{
          zIndex: 1,
          margin: 0,
          color: '#5a5047',
          fontFamily: "'Noto Serif SC', serif",
          fontSize: '12px',
          lineHeight: '1.55',
          letterSpacing: '.8px',
        }}
      >
        {world.desc}
      </p>

      <div
        className="relative flex flex-wrap"
        style={{ zIndex: 1, gap: '5px', marginTop: '8px' }}
      >
        {world.chips.map((chip) => (
          <span
            key={chip}
            style={{
              border: '1px solid rgba(34,29,24,0.13)',
              color: '#948879',
              background: 'rgba(248,244,236,0.36)',
              padding: '3px 6px',
              fontSize: '10px',
              letterSpacing: '1px',
              fontFamily: "'Noto Serif SC', serif",
            }}
          >
            {chip}
          </span>
        ))}
      </div>

      {selected && (
        <div
          className="relative"
          style={{
            zIndex: 1,
            marginTop: '8px',
            borderTop: '1px solid rgba(34,29,24,0.13)',
            paddingTop: '8px',
          }}
        >
          <p
            style={{
              margin: 0,
              color: '#5a5047',
              fontFamily: "'Noto Serif SC', serif",
              fontSize: '12px',
              lineHeight: '1.55',
              letterSpacing: '.8px',
            }}
          >
            {world.detailDesc}
          </p>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '7px' }}>
            {world.configOptions.map((opt) => (
              <button
                key={opt}
                onClick={(e) => {
                  e.stopPropagation();
                  onConfigChange(opt);
                }}
                title={opt}
                style={{
                  height: '30px',
                  border: '1px solid',
                  borderColor: currentConfig === opt ? '#221d18' : 'rgba(34,29,24,0.14)',
                  background: currentConfig === opt ? '#221d18' : 'rgba(248,244,236,0.34)',
                  color: currentConfig === opt ? '#f8f4ec' : '#948879',
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: '11px',
                  letterSpacing: '.5px',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  padding: '0 6px',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
