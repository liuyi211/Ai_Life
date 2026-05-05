import type { CreationForm } from '../data';
import { useWorldStore } from '../../../stores/worldStore';

interface StepConfirmProps {
  form: CreationForm;
}

export default function StepConfirm({ form }: StepConfirmProps) {
  const allWorlds = useWorldStore((state) => state.allWorlds);
  const world = allWorlds.find((w) => w.id === form.world);
  const talentText = form.talents.length > 0
    ? form.talents.map((t) => t.name).join('、')
    : '未抽取';
  const legacyText = form.legacy.length > 0
    ? form.legacy.map((l) => l.name).join('、')
    : '未选择';

  return (
    <div className="flex flex-col h-full" style={{ animation: 'fadeUp .34s ease both' }}>
      <div className="flex justify-between items-end" style={{ marginBottom: '11px' }}>
        <span style={{ color: '#221d18', fontSize: '16px', letterSpacing: '3px' }}>确认命线</span>
        <span style={{ color: '#948879', fontSize: '13px', letterSpacing: '2px', fontStyle: 'italic' }}>Final Chronicle</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto" style={{ paddingRight: '3px' }}>
        <div
          style={{
            border: '1px solid rgba(34,29,24,0.28)',
            background: 'rgba(248,244,236,0.36)',
            padding: '18px 16px',
            marginBottom: '12px',
          }}
        >
          {[
            { label: '世界', value: world?.name || '地球 Online' },
            { label: '姓名', value: form.name || '无名者' },
            { label: '性别', value: form.gender },
            { label: '开局', value: form.age },
            { label: '天赋', value: talentText },
            { label: '继承', value: legacyText },
            { label: '出身', value: '由 AI 随机生成' },
          ].map((item, i) => (
            <div
              key={i}
              className="flex justify-between"
              style={{
                gap: '18px',
                borderBottom: '1px solid rgba(34,29,24,0.13)',
                padding: '11px 0',
              }}
            >
              <span style={{ color: '#948879', fontSize: '12px', letterSpacing: '2px', whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
              <b
                style={{
                  fontWeight: 400,
                  color: '#221d18',
                  fontSize: '14px',
                  letterSpacing: '1px',
                  textAlign: 'right',
                }}
              >
                {item.value}
              </b>
            </div>
          ))}
        </div>

        <article
          className="relative"
          style={{
            border: '1px solid rgba(34,29,24,0.28)',
            background: 'linear-gradient(180deg, rgba(248,244,236,0.58), rgba(238,233,223,0.34)), radial-gradient(circle at 50% 10%, rgba(159,124,62,0.13), transparent 35%)',
            padding: '13px 13px 12px',
            marginBottom: '9px',
            overflow: 'hidden',
            boxShadow: '0 10px 32px rgba(34,29,24,0.06)',
          }}
        >
          <div
            className="absolute pointer-events-none"
            style={{ inset: '8px', border: '1px solid rgba(34,29,24,0.08)' }}
          />
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
              Opening Prophecy
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
              开局预言
            </span>
          </div>

          <h3
            className="relative"
            style={{
              zIndex: 1,
              margin: '0 0 6px',
              fontWeight: 400,
              fontSize: '21px',
              letterSpacing: '3px',
              color: '#221d18',
            }}
          >
            第一声回响
          </h3>

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
            你将从一个看似普通的夜晚开始。命运不会立刻揭开真相，它只会先递给你一个微小而难以忽视的选择。
          </p>

          <div
            className="relative flex flex-wrap"
            style={{ zIndex: 1, gap: '5px', marginTop: '8px' }}
          >
            {['关键节点', '长期因果', '隐藏变量', '人生模拟'].map((chip) => (
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
        </article>
      </div>
    </div>
  );
}
