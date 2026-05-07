import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { saveApi, aiApi, legacyApi, settlementApi } from '../services/api';
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
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [gradeDesc, setGradeDesc] = useState('');
  const [saveId, setSaveId] = useState<string | null>(null);

  // 遗产选择相关状态
  const [aiLegacies, setAiLegacies] = useState<LegacyItem[]>([]);
  const [legaciesLoading, setLegaciesLoading] = useState(false);
  const [selectedLegacy, setSelectedLegacy] = useState<Set<string>>(new Set());
  const [userLegacyCount, setUserLegacyCount] = useState(0);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [pendingLegacy, setPendingLegacy] = useState<LegacyItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [journeyExpanded, setJourneyExpanded] = useState(false);
  const [legacySaved, setLegacySaved] = useState(false);

  const score = useMemo(() => {
    if (!gameState) return { total: 0, grade: 'C' };
    return calculateScore(gameState);
  }, [gameState]);

  useEffect(() => {
    const load = async () => {
      try {
        const sid = searchParams.get('saveId');
        if (!sid) { navigate('/'); return; }
        setSaveId(sid);

        const res = await saveApi.getById(sid);
        const state = createGameStateFromSave(res.data.save);
        setGameState(state);

        // 加载用户当前遗产数量
        try {
          const legacyRes = await legacyApi.list();
          if (legacyRes.data.success) setUserLegacyCount(legacyRes.data.count || 0);
        } catch { /* 忽略 */ }

        // 检查 localStorage 缓存
        const cachedSummary = localStorage.getItem(`settlement_summary_${sid}`);
        const cachedTitle = localStorage.getItem(`settlement_title_${sid}`);
        const cachedGradeDesc = localStorage.getItem(`settlement_gradeDesc_${sid}`);
        const cachedLegacies = localStorage.getItem(`settlement_legacies_${sid}`);

        if (cachedSummary) {
          // 已结算过，直接用缓存
          setSummary(cachedSummary);
          setTitle(cachedTitle || '');
          setGradeDesc(cachedGradeDesc || '');
          if (cachedLegacies) {
            try { setAiLegacies(JSON.parse(cachedLegacies)); } catch { /* ignore */ }
          }
          setLoading(false);
          return;
        }

        // 首次结算，检查 API Key
        let hasApiKey = false;
        try {
          const configRes = await aiApi.getConfig();
          hasApiKey = configRes.data.config?.hasApiKey || false;
        } catch { /* 忽略 */ }

        if (hasApiKey) {
          const character = {
            name: state.character.name,
            world: state.character.world,
            age: state.character.age,
            personality: state.character.personality,
            desire: state.character.desire,
            attributes: state.character.attributes,
            talents: state.character.talents.map(t =>
              typeof t === 'object' ? { name: t.name, desc: t.desc } : { name: t, desc: '' }
            ),
          };

          // 1. 调用 AI 生成人生总结、标题和评价
          setSummaryLoading(true);
          try {
            const summaryRes = await settlementApi.generateSummary({
              character,
              history: state.history,
              score: score.total,
            });
            if (summaryRes.data.success) {
              const s = summaryRes.data.summary || '';
              const t = summaryRes.data.title || '';
              const g = summaryRes.data.gradeDesc || '';
              setSummary(s);
              setTitle(t);
              setGradeDesc(g);
              localStorage.setItem(`settlement_summary_${sid}`, s);
              if (t) localStorage.setItem(`settlement_title_${sid}`, t);
              if (g) localStorage.setItem(`settlement_gradeDesc_${sid}`, g);
            }
          } catch { /* 忽略 */ }
          setSummaryLoading(false);

          // 2. AI 生成遗产
          setLegaciesLoading(true);
          try {
            const legacyRes = await settlementApi.generateLegacies({
              character,
              history: state.history,
            });
            if (legacyRes.data.success && legacyRes.data.legacies?.length > 0) {
              setAiLegacies(legacyRes.data.legacies);
              localStorage.setItem(`settlement_legacies_${sid}`, JSON.stringify(legacyRes.data.legacies));
            }
          } catch { /* 忽略 */ }
          setLegaciesLoading(false);
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
      } else if (next.size < 1) {
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
    const legacy = [
      ...gameState.character.legacy.map(l => typeof l === 'object' ? l.name : l),
      ...items.map(i => i.name),
    ].slice(0, 3);

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
    await doSaveAndNavigate([]);
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

  // 仅保留遗产（不跳转，不开启来世）
  const handleSaveLegacy = async () => {
    const selectedItems = aiLegacies
      .filter((l) => selectedLegacy.has(l.name))
      .slice(0, 1);
    if (selectedItems.length === 0) return;
    setSaving(true);
    try {
      // 检查容量
      if (userLegacyCount + selectedItems.length > 10) {
        setPendingLegacy(selectedItems);
        setShowReplaceModal(true);
        setSaving(false);
        return;
      }
      await legacyApi.add(selectedItems);
      setLegacySaved(true);
      // 刷新遗产数量
      const res = await legacyApi.list();
      if (res.data.success) setUserLegacyCount(res.data.count || 0);
    } catch {
      // 忽略
    }
    setSaving(false);
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

  // 人生历程：展示全部历史节点
  const lifeJourney = history;

  // 遗产数据（AI 生成）
  const legacyItems: LegacyItem[] = aiLegacies;

  const selectedCount = selectedLegacy.size;
  const quotaFull = selectedCount >= 1;

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

          {/* 标题 - AI 生成 */}
          <h2 style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: 400, color: '#221d18', letterSpacing: '2px', lineHeight: 1.2 }}>
            {title || `${character.personality}之后`}
          </h2>
          {gradeDesc && (
            <div style={{ margin: '0 0 12px', color: '#7a2020', fontSize: '13px', letterSpacing: '1px', fontStyle: 'italic' }}>
              {gradeDesc}
            </div>
          )}

          {/* 总结文字 */}
          <p style={{ margin: '0 0 20px', color: '#5a5047', fontSize: '13px', lineHeight: '1.75', letterSpacing: '0.5px' }}>
            {summaryLoading ? (
              <span style={{ color: '#948879', fontStyle: 'italic' }}>AI 正在生成总结...</span>
            ) : (
              summary || defaultSummary
            )}
          </p>
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
            { label: '出身', value: character.worldConfig || '现代' },
            { label: '天赋', value: character.talents.map((t: any) => typeof t === 'object' ? t.name : t).slice(0, 2).join(' / ') || '无' },
            { label: '终局', value: history[history.length - 1]?.eventType === 'death' ? '寿终正寝' : '人生落幕' },
          ].map((item, i) => (
            <div key={i} style={pageStyles.infoRow}>
              <span style={{ color: '#948879', fontSize: '12px' }}>{item.label}</span>
              <span style={{ color: '#221d18', fontSize: '12px', textAlign: 'right' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 人生历程 - 支持展开收起 */}
      {lifeJourney.length > 0 && (
        <section style={pageStyles.section}>
          <div style={pageStyles.sectionTitle}>
            <span>人生历程</span>
            <span style={{ fontSize: '11px', color: '#948879', fontStyle: 'italic', letterSpacing: '1px' }}>Life Journey</span>
          </div>
          <div style={pageStyles.timeline}>
            {(journeyExpanded ? lifeJourney : lifeJourney.slice(0, 5)).map((entry, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    border: entry.isDeath ? '1.5px solid #7a2020' : '1.5px solid rgba(34,29,24,0.2)',
                    background: entry.isDeath ? '#7a2020' : 'transparent',
                  }} />
                  <div style={{ width: '1px', flex: 1, background: 'rgba(34,29,24,0.12)', marginTop: '4px', minHeight: '12px' }} />
                </div>
                <div style={{ flex: 1, paddingBottom: '8px' }}>
                  <p style={{ margin: 0, color: entry.isDeath ? '#7a2020' : '#5a5047', fontSize: '13px', lineHeight: '1.6' }}>
                    {entry.narrative}
                  </p>
                  {entry.choice && (
                    <div style={{ marginTop: '6px', paddingLeft: '10px', borderLeft: '1px solid rgba(159,124,62,0.4)', color: '#9f7c3e', fontSize: '12px' }}>
                      抉择：{entry.choice}
                      {entry.effects && Object.entries(entry.effects).filter(([,v]) => v && v !== 0).length > 0 && (
                        <span> · {Object.entries(entry.effects).filter(([,v]) => v && v !== 0).map(([k, v]) => `${getAttrLabel(k)}${v > 0 ? '+' : ''}${v}`).join('，')}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {/* 展开/收起按钮 */}
            {lifeJourney.length > 5 && (
              <button
                onClick={() => setJourneyExpanded(!journeyExpanded)}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: '8px',
                  padding: '8px',
                  border: '1px solid rgba(34,29,24,0.12)',
                  background: 'transparent',
                  color: '#7a2020',
                  fontSize: '12px',
                  letterSpacing: '2px',
                  cursor: 'pointer',
                  fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
                }}
              >
                {journeyExpanded ? `收起（共 ${lifeJourney.length} 条）` : `展开全部（共 ${lifeJourney.length} 条）`}
              </button>
            )}
          </div>
        </section>
      )}

      {/* 保留遗产 - AI 生成，可选 1 项 */}
      <section style={pageStyles.section}>
        <div style={pageStyles.sectionTitle}>
          <span>保留遗产</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#948879', fontStyle: 'italic', letterSpacing: '1px' }}>Inheritance</span>
            <span style={{ fontSize: '11px', color: '#7a2020', letterSpacing: '1px' }}>
              已选 {selectedCount} / 1
            </span>
          </div>
        </div>
        <p style={{ margin: '0 0 12px', color: '#948879', fontSize: '12px', lineHeight: '1.5', letterSpacing: '0.5px' }}>
          AI 根据人生经历提炼的遗产，选择 1 项保存到账户（当前账户：{userLegacyCount} / 10）
        </p>

        {legaciesLoading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#948879', fontSize: '13px', letterSpacing: '1px' }}>
            AI 正在提炼遗产...
          </div>
        ) : legacyItems.length > 0 ? (
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
                  <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#7a2020', letterSpacing: '0.5px' }}>{item.rarity || '普通'}</span>
                    {item.source && (
                      <span style={{ fontSize: '9px', color: '#948879', letterSpacing: '0.5px' }}>{item.source}</span>
                    )}
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
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#948879', fontSize: '12px', letterSpacing: '1px', border: '1px solid rgba(34,29,24,0.08)', background: '#f8f4ec' }}>
            AI 暂未生成遗产，可直接开启来世
          </div>
        )}

        {/* 独立保留遗产按钮 */}
        {selectedCount > 0 && !legacySaved && (
          <button
            onClick={handleSaveLegacy}
            disabled={saving}
            style={{
              ...pageStyles.btnOutline,
              width: '100%',
              marginTop: '12px',
              height: '42px',
              opacity: saving ? 0.6 : 1,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? '保存中...' : '保留遗产'}
          </button>
        )}
        {legacySaved && (
          <div style={{ marginTop: '12px', padding: '10px 16px', background: 'rgba(62,106,75,0.08)', border: '1px solid rgba(62,106,75,0.3)', color: '#3e6a4b', fontSize: '12px', letterSpacing: '1px', textAlign: 'center' }}>
            ✓ 遗产已保留
          </div>
        )}
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
            {saving ? '加载中...' : '开启来世'}
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
        @keyframes blink {
          50% { opacity: 0; }
        }
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
