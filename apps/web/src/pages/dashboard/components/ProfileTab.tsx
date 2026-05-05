import { useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import AIConfigSheet from './AIConfigSheet';
import LegacySheet from './LegacySheet';

interface ProfileTabProps {
  openSheet: (title: string, text: string) => void;
  onLogout: () => void;
  showToast: (text: string) => void;
}

const PROFILE_ITEMS = [
  {
    index: '01',
    name: '继承遗产',
    desc: '技能 / 法宝 / 功法 / 特殊印记',
    state: '查看',
    sheetTitle: '继承遗产',
    sheetText:
      '已保留的前世遗产：竞赛直觉、败后调息、裂纹命灯、半页观心诀、未寄出的信。新建人生时可从这些技能、法宝、功法与印记中选择最多三项继承。',
  },
  {
    index: '02',
    name: '模型接入',
    desc: 'API Key / 默认模型 / 叙事参数',
    state: '进入',
    sheetTitle: '模型接入',
    sheetText:
      '这里可以配置 AI 模型供应商、API Key、默认模型、叙事生成参数与连接状态。',
  },
];

export default function ProfileTab({ openSheet, onLogout, showToast }: ProfileTabProps) {
  const user = useAuthStore((state) => state.user);
  const [aiConfigOpen, setAiConfigOpen] = useState(false);
  const [legacyOpen, setLegacyOpen] = useState(false);

  return (
    <div className="tab-page active" style={{ animation: 'fadeUp .32s ease both' }}>
      <article
        className="relative"
        style={{
          margin: '2px 0 14px',
          padding: '18px 20px 16px',
          border: '1px solid rgba(34,29,24,0.28)',
          background:
            'linear-gradient(180deg, rgba(248,244,236,0.58), rgba(238,233,223,0.36)), radial-gradient(circle at 78% 4%, rgba(122,32,32,0.08), transparent 34%)',
          overflow: 'hidden',
          boxShadow: '0 16px 48px rgba(34,29,24,0.09)',
        }}
      >
        <div
          className="absolute pointer-events-none"
          style={{ inset: '11px', border: '1px solid rgba(34,29,24,0.08)' }}
        />

        {[
          { left: '12px', top: '12px', borderLeft: '1px solid', borderTop: '1px solid' },
          { right: '12px', top: '12px', borderRight: '1px solid', borderTop: '1px solid' },
          { left: '12px', bottom: '12px', borderLeft: '1px solid', borderBottom: '1px solid' },
          { right: '12px', bottom: '12px', borderRight: '1px solid', borderBottom: '1px solid' },
        ].map((style, i) => (
          <span
            key={i}
            className="absolute pointer-events-none"
            style={{
              width: '18px',
              height: '18px',
              borderColor: 'rgba(122,32,32,0.55)',
              opacity: 0.55,
              ...style,
            }}
          />
        ))}

        <div
          style={{
            position: 'absolute',
            right: '18px',
            top: '48px',
            color: 'rgba(34,29,24,0.04)',
            fontSize: '34px',
            letterSpacing: '5px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          SOUL ECHO
        </div>

        <div
          className="relative flex justify-between items-center"
          style={{ zIndex: 1, marginBottom: '24px', color: '#948879', fontSize: '12px', letterSpacing: '2px' }}
        >
          <div
            style={{
              color: '#7a2020',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              letterSpacing: '2px',
            }}
          >
            <div
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#7a2020',
                boxShadow: '0 0 0 7px rgba(122,32,32,0.07)',
              }}
            />
            灵魂印记已载入
          </div>
          <div>GUEST ECHO</div>
        </div>

        <div
          className="relative flex items-end justify-between"
          style={{ zIndex: 1, gap: '18px', marginBottom: '18px' }}
        >
          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                margin: '0 0 7px',
                fontSize: '32px',
                lineHeight: '1.05',
                fontWeight: 400,
                letterSpacing: '5px',
                textAlign: 'left',
                color: '#221d18',
              }}
            >
              {user?.username || '无名者'}
            </h2>
            <p
              style={{
                margin: 0,
                color: '#948879',
                fontSize: '13px',
                letterSpacing: '2px',
              }}
            >
              Soul ID / {user?.username || 'Guest Echo'}
            </p>
          </div>

          <div
            className="relative grid place-items-center"
            style={{
              flex: '0 0 auto',
              width: '48px',
              height: '48px',
              border: '1px solid rgba(122,32,32,0.24)',
              borderRadius: '50%',
              color: '#7a2020',
              fontSize: '18px',
              background: 'rgba(248,244,236,0.38)',
            }}
          >
            <div
              className="absolute"
              style={{
                inset: '7px',
                borderRadius: '50%',
                border: '1px solid rgba(122,32,32,0.13)',
              }}
            />
            印
          </div>
        </div>

        <div
          className="relative grid"
          style={{
            zIndex: 1,
            gridTemplateColumns: 'repeat(3, 1fr)',
            borderTop: '1px solid rgba(34,29,24,0.13)',
            borderBottom: '1px solid rgba(34,29,24,0.13)',
          }}
        >
          {[
            { value: String(user?.generationCount || 0).padStart(2, '0'), label: '回响' },
            { value: '01', label: '主线' },
            { value: '03', label: '档案' },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center',
                padding: '13px 0 12px',
                borderRight: i < 2 ? '1px solid rgba(34,29,24,0.13)' : 'none',
              }}
            >
              <b
                style={{
                  display: 'block',
                  fontSize: '24px',
                  lineHeight: 1,
                  fontWeight: 300,
                  color: '#221d18',
                }}
              >
                {stat.value}
              </b>
              <span
                style={{
                  display: 'block',
                  marginTop: '8px',
                  color: '#948879',
                  fontSize: '11px',
                  letterSpacing: '2px',
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </article>

      <div style={{ borderTop: '1px solid rgba(34,29,24,0.13)', marginBottom: '18px' }}>
        {PROFILE_ITEMS.map((item) => (
          <article
            key={item.index}
            className="grid"
            style={{
              gridTemplateColumns: '42px 1fr auto',
              gap: '12px',
              alignItems: 'center',
              padding: '16px 0',
              borderBottom: '1px solid rgba(34,29,24,0.13)',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (item.name === '模型接入') {
                setAiConfigOpen(true);
              } else if (item.name === '继承遗产') {
                setLegacyOpen(true);
              } else {
                openSheet(item.sheetTitle, item.sheetText);
              }
            }}
          >
            <div
              style={{
                color: '#948879',
                fontSize: '22px',
                fontWeight: 300,
              }}
            >
              {item.index}
            </div>
            <div>
              <h3
                style={{
                  margin: '0 0 5px',
                  fontSize: '18px',
                  fontWeight: 400,
                  letterSpacing: '2px',
                  color: '#221d18',
                }}
              >
                {item.name}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: '#948879',
                  fontSize: '12px',
                  letterSpacing: '1px',
                }}
              >
                {item.desc}
              </p>
            </div>
            <div
              style={{
                color: '#7a2020',
                fontSize: '12px',
                letterSpacing: '2px',
              }}
            >
              {item.state}
            </div>
          </article>
        ))}

        <article
          className="grid"
          style={{
            gridTemplateColumns: '42px 1fr auto',
            gap: '12px',
            alignItems: 'center',
            padding: '16px 0',
            borderBottom: '1px solid rgba(34,29,24,0.13)',
            cursor: 'pointer',
          }}
          onClick={onLogout}
        >
          <div
            style={{
              color: '#948879',
              fontSize: '22px',
              fontWeight: 300,
            }}
          >
            03
          </div>
          <div>
            <h3
              style={{
                margin: '0 0 5px',
                fontSize: '18px',
                fontWeight: 400,
                letterSpacing: '2px',
                color: '#221d18',
              }}
            >
              退出登录
            </h3>
            <p
              style={{
                margin: 0,
                color: '#948879',
                fontSize: '12px',
                letterSpacing: '1px',
              }}
            >
              结束当前会话，返回登录神殿
            </p>
          </div>
          <div
            style={{
              color: '#7a2020',
              fontSize: '12px',
              letterSpacing: '2px',
            }}
          >
            退出
          </div>
        </article>
      </div>

      <AIConfigSheet
        isOpen={aiConfigOpen}
        onClose={() => setAiConfigOpen(false)}
        showToast={showToast}
      />
      <LegacySheet
        isOpen={legacyOpen}
        onClose={() => setLegacyOpen(false)}
        showToast={showToast}
      />
    </div>
  );
}
