import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { saveApi, aiApi, legacyApi } from '../services/api';
import LegacyReplaceModal from './components/LegacyReplaceModal';
import type { GameState } from '../engine/gameEngine';
import { createGameStateFromSave, serializeGameState } from '../engine/gameEngine';

// ==================== 工具函数 ====================

function calculateScore(state: GameState): { total: number; grade: string } {
  const ageScore = Math.min(30, state.character.age / 100 * 30);
  const avgAttr = Object.values(state.character.attributes).reduce((a, b) => a + b, 0) / 4;
  const attrScore = Math.min(30, avgAttr / 10 * 30);
  const expScore = Math.min(20, state.history.length / 20 * 20);
  const total = Math.round(ageScore + attrScore + expScore + 20);

  let grade = 'C';
  if (total >= 95) grade = 'S+';
  else if (total >= 90) grade = 'S';
  else if (total >= 85) grade = 'S-';
  else if (total >= 80) grade = 'A+';
  else if (total >= 75) grade = 'A';
  else if (total >= 70) grade = 'A-';
  else if (total >= 65) grade = 'B+';
  else if (total >= 60) grade = 'B';
  else if (total >= 55) grade = 'B-';
  else if (total >= 50) grade = 'C+';
  else if (total >= 45) grade = 'C';

  return { total, grade };
}

function calculateInitialAttributes(state: GameState): Record<string, number> {
  const initial = { ...state.character.attributes };
  state.history.forEach(h => {
    if (h.effects) {
      Object.entries(h.effects).forEach(([k, v]) => {
        if (v && (initial as any)[k] !== undefined) {
          (initial as any)[k] -= v;
        }
      });
    }
  });
  Object.keys(initial).forEach(k => {
    if ((initial as any)[k] < 1 || (initial as any)[k] > 20) {
      (initial as any)[k] = (state.character.attributes as any)[k];
    }
  });
  return initial;
}

function getAttrLabel(key: string): string {
  const map: Record<string, string> = { body: '体魄', mind: '悟性', charm: '羁绊', fate: '气运' };
  return map[key] || key;
}

interface LegacyItem {
  name: string;
  desc: string;
  source?: string;
  mark?: string;
  rarity?: string;
}

// ==================== 组件 ====================

export default function SettlementPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState('');
  const [saveId, setSaveId] = useState<string | null>(null);

  // 遗产选择相关状态
  const [selectedLegacy, setSelectedLegacy] = useState<Set<string>>(new Set());
  const [userLegacyCount, setUserLegacyCount] = useState(0);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [pendingLegacy, setPendingLegacy] = useState<LegacyItem[]>([]);
  const [saving, setSaving] = useState(false);

  const score = useMemo(() => {
    if (!gameState) return { total: 0, grade: 'C' };
    return calculateScore(gameState);
  }, [gameState]);

  const initialAttributes = useMemo(() => {
    if (!gameState) return {};
    return calculateInitialAttributes(gameState);
  }, [gameState]);

  useEffect(() => {
    const load = async () => {
      try {
        const sid = searchParams.get('saveId');
        if (!sid) {
          navigate('/');
          return;
        }
        setSaveId(sid);

        const res = await saveApi.getById(sid);
        const state = createGameStateFromSave(res.data.save);
        setGameState(state);

        // 加载用户当前遗产数量
        try {
          const legacyRes = await legacyApi.list();
          if (legacyRes.data.success) {
            setUserLegacyCount(legacyRes.data.count || 0);
          }
        } catch {
          // 忽略
        }

        // 调用AI生成人生总结
        try {
          const configRes = await aiApi.getConfig();
          if (configRes.data.config?.hasApiKey) {
            const summaryRes = await aiApi.generateSummary({
              character: {
                name: state.character.name,
                world: state.character.world,
                age: state.character.age,
                personality: state.character.personality,
                desire: state.character.desire,
                attributes: state.character.attributes,
                talents: state.character.talents.map(t => typeof t === 'object' ? { name: t.name, desc: t.desc } : { name: t, desc: '' }),
              },
              history: state.history,
              score: score.total,
            });
            if (summaryRes.data.success && summaryRes.data.summary) {
              setSummary(summaryRes.data.summary);
            }
          }
        } catch {
          // AI 生成失败使用默认总结
        }

        setLoading(false);
      } catch (err) {
        console.error('Load settlement failed:', err);
        navigate('/');
      }
    };
    load();
  }, [navigate, searchParams]);

  const toggleLegacySelection = (name: string) => {
    setSelectedLegacy(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else if (next.size < 2) {
        next.add(name);
      }
      return next;
    });
  };

  const doSaveAndNavigate = async (items: LegacyItem[]) => {
    if (!gameState || !saveId) return;

    const genes = Object.entries(gameState.character.attributes)
      .filter(([_, v]) => v >= 8)
      .map(([k, v]) => ({ attr: k, value: Math.min(3, Math.floor((v - 7) / 2)) }));
    const fragments = Math.floor(score.total / 10) + gameState.character.age;
    const legacy = gameState.character.legacy.map(l => typeof l === 'object' ? l.name : l).slice(0, 3);

    const inheritData = {
      generation: (gameState.generation || 1) + 1,
      genes,
      fragments,
      legacy,
    };
    localStorage.setItem('reincarnation_inherit', JSON.stringify(inheritData));

    // 保存选中的遗产到用户账户
    if (items.length > 0) {
      try {
        await legacyApi.add(items);
      } catch {
        // 忽略错误
      }
    }

    try {
      await saveApi.update(saveId, {
        ...serializeGameState(gameState),
        gameStatus: 'ascended',
        generation: inheritData.generation,
      });
    } catch {
      // 忽略错误
    }

    navigate('/creation');
  };

  const handleReincarnation = async () => {
    if (!gameState) return;
    setSaving(true);

    // 获取选中的遗产对象
    const selectedItems = gameState.character.legacy
      .filter((l: any) => typeof l === 'object' && selectedLegacy.has(l.name))
      .slice(0, 2);

    if (selectedItems.length === 0) {
      // 没选遗产，直接跳转
      await doSaveAndNavigate([]);
      return;
    }

    // 检查容量
    if (userLegacyCount + selectedItems.length <= 10) {
      // 容量足够，直接保存
      await doSaveAndNavigate(selectedItems);
      return;
    }

    // 容量不足，弹出替换弹窗
    setPendingLegacy(selectedItems);
    setShowReplaceModal(true);
    setSaving(false);
  };

  const handleReplaceDone = async () => {
    // 替换完成后，重新获取用户遗产数量
    try {
      const res = await legacyApi.list();
      if (res.data.success) {
        const newCount = res.data.count || 0;
        setUserLegacyCount(newCount);

        // 再次检查容量
        if (newCount + pendingLegacy.length <= 10) {
          setShowReplaceModal(false);
          await doSaveAndNavigate(pendingLegacy);
        }
        // 如果仍然不够，用户需要继续删除
      }
    } catch {
      // 忽略
    }
  };

  const handleArchive = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div style={pageStyles.page}>
        <div style={{ ...pageStyles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#948879', fontSize: '14px', letterSpacing: '2px' }}>结算中...</div>
        </div>
      </div>
    );
  }

  if (!gameState) return null;

  const { character, history } = gameState;
  const choicesCount = history.filter(h => h.choice).length;
  const regretsCount = Math.max(0, history.length - choicesCount);
  const legacyCount = character.legacy.length;

  // 生成关键命线（取5条重要节点）
  const keyThreads = history
    .filter(h => h.eventType === 'choice' || h.eventType === 'breakthrough' || h.eventType === 'death' || h.eventType === 'loss')
    .slice(0, 5);

  // 遗产数据（本世获得）
  const legacyItems: LegacyItem[] = character.legacy.map((l: any) => {
    const name = typeof l === 'object' ? l.name : l;
    const desc = typeof l === 'object' ? l.desc : '';
    const source = typeof l === 'object' ? (l.source || '') : '';
    const mark = typeof l === 'object' ? l.mark : '';
    const rarity = typeof l === 'object' ? l.rarity : '';
    return { name, desc, source, mark, rarity };
  });

  const selectedCount = selectedLegacy.size;
  const quotaFull = selectedCount >= 2;

  // 默认总结
  const defaultSummary = `${character.name}于${character.world}度过了一生。性格${character.personality}，欲望${character.desire}，经历了${history.length}个人生节点，最终在${character.age}岁时画上句点。`;

  return (
    <div style={pageStyles.page}>
      {/* 顶部导航 */}
      <header style={pageStyles.header}>
        <button style={pageStyles.iconBtn} onClick={() => navigate('/')}>
          ‹
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#948879', fontSize: '10px', letterSpacing: '2px', fontStyle: 'italic', marginBottom: '4px' }}>
            Final Echo
          </div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 400, letterSpacing: '4px', color: '#221d18' }}>
            终局结算
          </h1>
        </div>
        <button style={pageStyles.iconBtn} onClick={() => {}}>
          印
        </button>
      </header>

      {/* 主卡片 */}
      <section style={{ padding: '0 22px 24px' }}>
        <div style={pageStyles.mainCard}>
          {/* 卡片头部 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7a2020' }} />
              <span style={{ color: '#7a2020', fontSize: '11px', letterSpacing: '1px' }}>人生已落幕</span>
            </div>
            <div style={{ position: 'relative', textAlign: 'right' }}>
              <span style={{ position: 'absolute', right: '0', top: '-8px', fontSize: '36px', color: 'rgba(34,29,24,0.06)', fontWeight: 300, letterSpacing: '2px', lineHeight: 1 }}>
                ECH
              </span>
              <span style={{ position: 'relative', fontSize: '20px', color: '#221d18', fontWeight: 300, letterSpacing: '1px' }}>
                {score.grade}
              </span>
              <div style={{ fontSize: '9px', color: '#948879', letterSpacing: '1px' }}>综合评价</div>
            </div>
          </div>

          {/* 标题 */}
          <h2 style={{ margin: '0 0 12px', fontSize: '28px', fontWeight: 400, color: '#221d18', letterSpacing: '2px', lineHeight: 1.2 }}>
            {character.personality}之后
          </h2>

          {/* 总结文字 */}
          <p style={{ margin: '0 0 20px', color: '#5a5047', fontSize: '13px', lineHeight: '1.75', letterSpacing: '0.5px' }}>
            {summary || defaultSummary}
          </p>

          {/* 统计数据 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', borderTop: '1px solid rgba(34,29,24,0.1)', paddingTop: '16px' }}>
            {[
              { value: character.age, label: '寿命' },
              { value: choicesCount, label: '抉择' },
              { value: regretsCount, label: '遗憾' },
              { value: legacyCount, label: '获得' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 300, color: '#221d18', letterSpacing: '1px', lineHeight: 1 }}>
                  {String(item.value).padStart(2, '0')}
                </div>
                <div style={{ fontSize: '10px', color: '#948879', marginTop: '4px', letterSpacing: '1px' }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 人生档案 */}
      <section style={pageStyles.section}>
        <div style={pageStyles.sectionTitle}>
          <span>人生档案</span>
          <span style={{ fontSize: '11px', color: '#948879', fontStyle: 'italic', letterSpacing: '1px' }}>Life Record</span>
        </div>
        <div style={pageStyles.infoCard}>
          {[
            { label: '姓名', value: character.name },
            { label: '世界', value: `${character.world} / ${character.worldConfig || '现代'}` },
            { label: '出身', value: gameState.lifeStatus?.identity || '普通人家' },
            { label: '天赋', value: character.talents.map((t: any) => typeof t === 'object' ? t.name : t).slice(0, 2).join(' / ') || '无' },
            { label: '终局', value: history[history.length - 1]?.summary || '寿终正寝' },
          ].map((item, i) => (
            <div key={i} style={pageStyles.infoRow}>
              <span style={{ color: '#948879', fontSize: '12px' }}>{item.label}</span>
              <span style={{ color: '#221d18', fontSize: '12px', textAlign: 'right' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 关键命线 */}
      {keyThreads.length > 0 && (
        <section style={pageStyles.section}>
          <div style={pageStyles.sectionTitle}>
            <span>关键命线</span>
            <span style={{ fontSize: '11px', color: '#948879', fontStyle: 'italic', letterSpacing: '1px' }}>Major Threads</span>
          </div>
          <div style={pageStyles.timeline}>
            {keyThreads.map((thread, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: i < keyThreads.length - 1 ? '16px' : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1.5px solid #7a2020', background: 'transparent' }} />
                  {i < keyThreads.length - 1 && (
                    <div style={{ width: '1px', flex: 1, background: 'rgba(34,29,24,0.12)', marginTop: '4px' }} />
                  )}
                </div>
                <div style={{ flex: 1, paddingBottom: i < keyThreads.length - 1 ? '16px' : 0 }}>
                  <div style={{ fontSize: '12px', color: '#7a2020', marginBottom: '4px', letterSpacing: '1px' }}>
                    {thread.year} 岁
                  </div>
                  <p style={{ margin: 0, color: '#5a5047', fontSize: '13px', lineHeight: '1.6' }}>
                    {thread.narrative || thread.event}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 属性终值 */}
      <section style={pageStyles.section}>
        <div style={pageStyles.sectionTitle}>
          <span>属性终值</span>
          <span style={{ fontSize: '11px', color: '#948879', fontStyle: 'italic', letterSpacing: '1px' }}>Final Attributes</span>
        </div>
        <div style={pageStyles.infoCard}>
          {Object.entries(character.attributes).map(([key, currentVal]) => {
            const initialVal = (initialAttributes as any)[key] || currentVal;
            const change = currentVal - initialVal;
            const maxVal = 20;
            const progress = (currentVal / maxVal) * 100;

            return (
              <div key={key} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: '#5a5047', fontSize: '13px', width: '40px' }}>{getAttrLabel(key)}</span>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 12px' }}>
                    <span style={{ fontSize: '11px', color: '#948879', width: '24px', textAlign: 'right' }}>
                      {String(initialVal).padStart(2, '0')}
                    </span>
                    <span style={{ color: '#948879', fontSize: '11px' }}>→</span>
                    <span style={{ fontSize: '13px', color: '#221d18', width: '24px' }}>
                      {String(currentVal).padStart(2, '0')}
                    </span>
                    <div style={{ flex: 1, height: '2px', background: 'rgba(34,29,24,0.08)', borderRadius: '1px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: '#7a2020', borderRadius: '1px' }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: change >= 0 ? '#7a2020' : '#5a5047', width: '30px', textAlign: 'right' }}>
                    {change >= 0 ? `+${change}` : change}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 保留遗产 - 可选择 */}
      {legacyItems.length > 0 && (
        <section style={pageStyles.section}>
          <div style={pageStyles.sectionTitle}>
            <span>保留遗产</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#948879', fontStyle: 'italic', letterSpacing: '1px' }}>Inheritance</span>
              <span style={{ fontSize: '11px', color: '#7a2020', letterSpacing: '1px' }}>
                已选 {selectedCount} / 2
              </span>
            </div>
          </div>
          <p style={{ margin: '0 0 12px', color: '#948879', fontSize: '12px', lineHeight: '1.5', letterSpacing: '0.5px' }}>
            选择最多 2 项遗产保存到账户（当前账户：{userLegacyCount} / 10）
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {legacyItems.map((item, i) => {
              const isSelected = selectedLegacy.has(item.name);
              const canSelect = !isSelected && !quotaFull;

              return (
                <div
                  key={i}
                  onClick={() => toggleLegacySelection(item.name)}
                  style={{
                    ...pageStyles.legacyCard,
                    border: isSelected
                      ? '1.5px solid rgba(122,32,32,0.5)'
                      : canSelect
                      ? '1px solid rgba(34,29,24,0.1)'
                      : '1px solid rgba(34,29,24,0.06)',
                    background: isSelected ? 'rgba(122,32,32,0.055)' : '#f8f4ec',
                    cursor: isSelected || canSelect ? 'pointer' : 'not-allowed',
                    opacity: !isSelected && quotaFull ? 0.6 : 1,
                    position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#7a2020',
                        color: '#f8f4ec',
                        fontSize: '10px',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      ✓
                    </div>
                  )}
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#7a2020', letterSpacing: '0.5px' }}>{item.rarity || '技能'}</span>
                  </div>
                  <div style={{ fontSize: '15px', color: '#221d18', marginBottom: '6px', fontWeight: 400, letterSpacing: '1px' }}>
                    {item.name}
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#948879', lineHeight: '1.5' }}>
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 最后回响 */}
      <section style={pageStyles.section}>
        <div style={pageStyles.sectionTitle}>
          <span>最后回响</span>
          <span style={{ fontSize: '11px', color: '#948879', fontStyle: 'italic', letterSpacing: '1px' }}>Last Words</span>
        </div>
        <div style={{ paddingLeft: '12px', borderLeft: '1.5px solid #7a2020' }}>
          <p style={{ margin: 0, color: '#5a5047', fontSize: '13px', lineHeight: '1.85', letterSpacing: '0.5px' }}>
            {summary
              ? `${summary.slice(0, 120)}...`
              : `如果人生可以重来，${character.name}未必会做出更聪明的选择。但或许会更早明白：有些失败并非终点，只是命运把人推回真正重要的东西面前。`
            }
          </p>
        </div>
      </section>

      {/* 底部按钮 */}
      <section style={{ padding: '24px 22px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            onClick={handleArchive}
            style={pageStyles.btnOutline}
            onMouseDown={(e) => {
              e.currentTarget.style.borderColor = '#7a2020';
              e.currentTarget.style.color = '#7a2020';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.borderColor = 'rgba(34,29,24,0.2)';
              e.currentTarget.style.color = '#5a5047';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(34,29,24,0.2)';
              e.currentTarget.style.color = '#5a5047';
            }}
          >
            封存档案
          </button>
          <button
            onClick={handleReincarnation}
            disabled={saving}
            style={{
              ...pageStyles.btnPrimary,
              opacity: saving ? 0.7 : 1,
            }}
            onMouseDown={(e) => {
              if (saving) return;
              e.currentTarget.style.background = '#7a2020';
              e.currentTarget.style.transform = 'translateY(1px)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.background = '#221d18';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#221d18';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {saving ? '保存中...' : selectedCount > 0 ? `保存 ${selectedCount} 项并开启来世` : '开启来世'}
          </button>
        </div>
      </section>

      {/* 遗产替换弹窗 */}
      {showReplaceModal && (
        <LegacyReplaceModal
          userLegacyCount={userLegacyCount}
          pendingLegacy={pendingLegacy}
          onClose={() => {
            setShowReplaceModal(false);
            setSaving(false);
          }}
          onDone={handleReplaceDone}
        />
      )}

      <style>{`
        @media (min-width: 768px) {
          body { display: flex; align-items: center; justify-content: center; background: #d4c8b8; }
          .settlement-page-wrapper { width: 430px; min-height: 860px; max-height: 96vh; overflow-y: auto; background: #f0ebe3; box-shadow: 0 30px 100px rgba(34,29,24,0.24); }
        }
      `}</style>
    </div>
  );
}

// ==================== 样式 ====================
const pageStyles: Record<string, React.CSSProperties> = {
  page: {
    position: 'relative',
    width: '100%',
    minHeight: '100vh',
    background: '#f0ebe3',
    color: '#221d18',
    fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  header: {
    display: 'grid',
    gridTemplateColumns: '44px 1fr 44px',
    alignItems: 'center',
    padding: '16px 16px 12px',
    gap: '8px',
  },
  iconBtn: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(34,29,24,0.15)',
    background: 'transparent',
    color: '#5a5047',
    fontSize: '18px',
    fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  mainCard: {
    border: '1px solid rgba(34,29,24,0.12)',
    background: '#f8f4ec',
    padding: '20px 18px',
    position: 'relative',
    overflow: 'hidden',
  },
  section: {
    padding: '0 22px 24px',
  },
  sectionTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '12px',
    color: '#221d18',
    fontSize: '15px',
    letterSpacing: '2px',
  },
  infoCard: {
    border: '1px solid rgba(34,29,24,0.1)',
    background: '#f8f4ec',
    padding: '16px 18px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid rgba(34,29,24,0.06)',
  },
  timeline: {
    border: '1px solid rgba(34,29,24,0.1)',
    background: '#f8f4ec',
    padding: '18px 16px 18px 14px',
  },
  legacyCard: {
    border: '1px solid rgba(34,29,24,0.1)',
    background: '#f8f4ec',
    padding: '14px 12px',
  },
  btnOutline: {
    height: '48px',
    border: '1px solid rgba(34,29,24,0.2)',
    background: 'transparent',
    color: '#5a5047',
    fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
    fontSize: '14px',
    letterSpacing: '3px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  btnPrimary: {
    height: '48px',
    border: 'none',
    background: '#221d18',
    color: '#f8f4ec',
    fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
    fontSize: '14px',
    letterSpacing: '3px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};
