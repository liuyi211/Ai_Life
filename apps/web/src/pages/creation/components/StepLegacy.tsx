import { useState, useEffect } from 'react';
import type { LegacyItem } from '../data';
import { legacyApi } from '../../../services/api';

interface StepLegacyProps {
  selected: LegacyItem[];
  onToggle: (item: LegacyItem) => void;
}

export default function StepLegacy({ selected, onToggle }: StepLegacyProps) {
  const [userLegacy, setUserLegacy] = useState<LegacyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const quota = 2 - selected.length;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await legacyApi.list();
        if (res.data.success) {
          setUserLegacy(res.data.legacy || []);
        }
      } catch {
        // 忽略错误
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center" style={{ animation: 'fadeUp .34s ease both' }}>
        <span style={{ color: '#948879', fontSize: '13px', letterSpacing: '2px' }}>加载遗产中...</span>
      </div>
    );
  }

  if (userLegacy.length === 0) {
    return (
      <div className="flex flex-col h-full" style={{ animation: 'fadeUp .34s ease both' }}>
        <div className="flex justify-between items-end" style={{ marginBottom: '11px' }}>
          <span style={{ color: '#221d18', fontSize: '16px', letterSpacing: '3px' }}>技能继承</span>
          <span style={{ color: '#948879', fontSize: '13px', letterSpacing: '2px', fontStyle: 'italic' }}>Legacy Inheritance</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div style={{ textAlign: 'center', color: '#948879', fontSize: '13px', lineHeight: '1.8' }}>
            <p>暂无可用遗产</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>完成一次人生轮回后将自动保存遗产</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ animation: 'fadeUp .34s ease both' }}>
      <div className="flex justify-between items-end" style={{ marginBottom: '11px' }}>
        <span style={{ color: '#221d18', fontSize: '16px', letterSpacing: '3px' }}>技能继承</span>
        <span style={{ color: '#948879', fontSize: '13px', letterSpacing: '2px', fontStyle: 'italic' }}>Legacy Inheritance</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto" style={{ paddingRight: '3px' }}>
        <article
          className="relative"
          style={{
            border: '1px solid rgba(34,29,24,0.28)',
            background: 'linear-gradient(180deg, rgba(248,244,236,0.58), rgba(238,233,223,0.34)), radial-gradient(circle at 50% 0%, rgba(122,32,32,0.08), transparent 42%)',
            padding: '16px 15px 14px',
            marginBottom: '12px',
            overflow: 'hidden',
            boxShadow: '0 12px 38px rgba(34,29,24,0.07)',
          }}
        >
          <div
            className="absolute pointer-events-none"
            style={{ inset: '9px', border: '1px solid rgba(34,29,24,0.08)' }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              right: '12px',
              top: '8px',
              color: 'rgba(34,29,24,0.045)',
              fontSize: '42px',
              letterSpacing: '4px',
            }}
          >
            LEGACY
          </div>

          <div
            className="relative flex justify-between items-start"
            style={{ zIndex: 1, gap: '14px', marginBottom: '12px' }}
          >
            <div>
              <h2
                style={{
                  margin: '0 0 7px',
                  fontSize: '25px',
                  fontWeight: 400,
                  letterSpacing: '4px',
                  color: '#221d18',
                }}
              >
                旧生遗产
              </h2>
              <p
                style={{
                  margin: 0,
                  color: '#948879',
                  fontSize: '12px',
                  lineHeight: '1.65',
                  letterSpacing: '.8px',
                }}
              >
                从已保存的遗产中选择最多两项带入新人生。遗产在上一次轮回结算时自动保存。
              </p>
            </div>
            <div
              style={{
                color: '#7a2020',
                fontSize: '24px',
                fontWeight: 300,
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}
            >
              <span style={{ color: '#948879', fontSize: '11px', letterSpacing: '1px' }}>可继承 </span>
              {quota}
            </div>
          </div>

          <div className="relative grid" style={{ zIndex: 1, gridTemplateColumns: 'repeat(2, 1fr)', gap: '7px' }}>
            {[0, 1].map((i) => (
              <div
                key={i}
                style={{
                  minHeight: '44px',
                  border: selected[i]
                    ? '1px solid rgba(122,32,32,0.34)'
                    : '1px dashed rgba(34,29,24,0.20)',
                  background: selected[i] ? 'rgba(122,32,32,0.045)' : 'rgba(248,244,236,0.24)',
                  display: 'grid',
                  placeItems: 'center',
                  color: selected[i] ? '#7a2020' : '#948879',
                  fontSize: '12px',
                  letterSpacing: '1px',
                  textAlign: 'center',
                  padding: '6px',
                }}
              >
                {selected[i]?.name || '空位'}
              </div>
            ))}
          </div>
        </article>

        <div>
          {userLegacy.map((item: any) => {
            const isSelected = selected.some((s) => s.name === item.name);
            return (
              <article
                key={item.name}
                onClick={() => onToggle(item as LegacyItem)}
                className="relative"
                style={{
                  border: '1px solid',
                  borderColor: isSelected ? 'rgba(122,32,32,0.42)' : 'rgba(34,29,24,0.13)',
                  background: isSelected ? 'rgba(122,32,32,0.055)' : 'rgba(248,244,236,0.30)',
                  padding: '13px 12px',
                  marginBottom: '9px',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: '.24s ease',
                  transform: isSelected ? 'translateX(3px)' : 'translateX(0)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    right: '9px',
                    bottom: '2px',
                    color: 'rgba(34,29,24,0.055)',
                    fontSize: '34px',
                    lineHeight: 1,
                    pointerEvents: 'none',
                  }}
                >
                  {item.mark || '◆'}
                </div>
                <div style={{ color: '#7a2020', fontSize: '11px', letterSpacing: '1.5px', marginBottom: '5px' }}>
                  {item.rarity || '普通'}
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
                  {item.name}
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: '#5a5047',
                    fontSize: '12px',
                    lineHeight: '1.6',
                    letterSpacing: '.7px',
                    maxWidth: '92%',
                  }}
                >
                  {item.desc}
                </p>
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '8px',
                    color: '#948879',
                    fontSize: '11px',
                    letterSpacing: '1px',
                  }}
                >
                  {item.source || '旧生遗产'}
                </span>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
