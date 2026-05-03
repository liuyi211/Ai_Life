import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveApi } from '../../../services/api';

interface SaveData {
  id: string;
  character: {
    name: string;
    world: string;
    age: number | string;
    lifeStage?: string;
    personality?: string;
    desire?: string;
    isAlive?: boolean;
  };
  history: Array<{ year: number; event: string; narrative?: string; choice: string }>;
  gameStatus?: string;
  updatedAt: string;
}

function NewLifeButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/creation')}
      style={{
        height: '54px',
        border: '1px solid rgba(34,29,24,0.28)',
        background: 'rgba(248,244,236,0.32)',
        color: '#221d18',
        fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
        fontSize: '16px',
        letterSpacing: '4px',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.borderColor = '#7a2020';
        e.currentTarget.style.color = '#7a2020';
        e.currentTarget.style.transform = 'translateY(2px)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.borderColor = 'rgba(34,29,24,0.28)';
        e.currentTarget.style.color = '#221d18';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(34,29,24,0.28)';
        e.currentTarget.style.color = '#221d18';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      新建人生
    </button>
  );
}

interface HomeTabProps {
  showToast: (text: string) => void;
}

export default function HomeTab({ showToast }: HomeTabProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeSave, setActiveSave] = useState<SaveData | null>(null);
  const [loadingSave, setLoadingSave] = useState(true);

  useEffect(() => {
    loadActiveSave();
  }, []);

  const loadActiveSave = async () => {
    setLoadingSave(true);
    try {
      const res = await saveApi.getActive();
      if (res.data.save) {
        setActiveSave(res.data.save);
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        showToast('加载存档失败');
      }
    } finally {
      setLoadingSave(false);
    }
  };

  const handleContinue = async () => {
    if (!activeSave) {
      showToast('无存档，请先创建角色');
      return;
    }
    setLoading(true);
    try {
      navigate(`/game?saveId=${activeSave.id}`);
    } catch {
      showToast('进入存档失败');
      setLoading(false);
    }
  };

  // 获取描述文本：优先使用最后一条历史记录的 narrative，否则使用角色描述
  const getDescription = () => {
    if (!activeSave) return '诸生命线，于此垂落。尚无铭刻之命线，请新建人生或从档案中选择。';
    if (activeSave.history && activeSave.history.length > 0) {
      const lastHistory = activeSave.history[activeSave.history.length - 1];
      if (lastHistory.narrative) return lastHistory.narrative;
      return lastHistory.event;
    }
    return `${activeSave.character.personality || ''}的${activeSave.character.name}，渴望${activeSave.character.desire || '未知的命运'}。`;
  };

  // 计算进度（0-100）
  const getProgress = () => {
    if (!activeSave) return 0;
    const age = typeof activeSave.character.age === 'number' ? activeSave.character.age : parseInt(activeSave.character.age as string) || 0;
    // 假设最大寿命 100 岁
    return Math.min(100, Math.round((age / 100) * 100));
  };

  // 计算当前阶段索引（0-4）
  const getStageIndex = () => {
    if (!activeSave) return 0;
    const stage = activeSave.character.lifeStage;
    const stageMap: Record<string, number> = {
      infant: 0,
      child: 1,
      youth: 2,
      adult: 3,
      elder: 4,
    };
    return stageMap[stage || ''] || 0;
  };

  // 获取状态文本
  const getStatusText = () => {
    if (!activeSave) return '等待铭刻';
    if (activeSave.gameStatus === 'dead' || !activeSave.character.isAlive) return '已终结';
    return '主线回响中';
  };

  // 获取世界显示名
  const getWorldDisplay = () => {
    if (!activeSave) return 'EARTH ONLINE';
    const worldMap: Record<string, string> = {
      '地球 Online': 'EARTH ONLINE',
      '赛博纪元': 'CYBER ERA',
      '修仙界': 'CULTIVATION',
      '武侠江湖': 'MARTIAL WORLD',
      '末日废土': 'DOOMSDAY',
      '神话纪元': 'MYTH ERA',
    };
    return worldMap[activeSave.character.world] || activeSave.character.world.toUpperCase();
  };

  // 获取阶段罗马数字
  const getStageRoman = () => {
    const stages = ['I', 'II', 'III', 'IV', 'V'];
    return stages[getStageIndex()] || 'I';
  };

  // 计算属性
  const getMetrics = () => {
    if (!activeSave) {
      return [
        { value: '-', label: '进度' },
        { value: '-', label: '因果' },
        { value: '-', label: '命格' },
        { value: '-', label: '年龄' },
      ];
    }
    const age = typeof activeSave.character.age === 'number' ? activeSave.character.age : parseInt(activeSave.character.age as string) || 0;
    const historyCount = activeSave.history?.length || 0;
    // 命格评级
    const grade = age < 20 ? 'C' : age < 40 ? 'B' : age < 60 ? 'A' : age < 80 ? 'A+' : 'S';

    return [
      { value: `${getProgress()}`, label: '进度' },
      { value: `${historyCount}`, label: '因果' },
      { value: grade, label: '命格' },
      { value: `${age}`, label: '年龄' },
    ];
  };

  const description = getDescription();
  const progress = getProgress();
  const stageIndex = getStageIndex();
  const statusText = getStatusText();
  const worldDisplay = getWorldDisplay();
  const stageRoman = getStageRoman();
  const metrics = getMetrics();

  return (
    <div className="tab-page active" style={{ animation: 'fadeUp .32s ease both' }}>
      <article
        className="relative"
        style={{
          minHeight: '258px',
          marginTop: '6px',
          marginBottom: '12px',
          padding: '18px 18px 16px',
          border: '1px solid rgba(34,29,24,0.28)',
          background:
            'linear-gradient(180deg, rgba(248,244,236,0.60), rgba(238,233,223,0.36)), radial-gradient(circle at 50% 13%, rgba(159,124,62,0.16), transparent 35%)',
          boxShadow: '0 24px 70px rgba(34,29,24,0.13)',
          overflow: 'hidden',
        }}
      >
        <div
          className="absolute pointer-events-none"
          style={{ inset: '12px', border: '1px solid rgba(34,29,24,0.09)' }}
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
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: '112px',
            transform: 'translateX(-50%)',
            color: 'rgba(34,29,24,0.045)',
            fontSize: '32px',
            letterSpacing: '5px',
            whiteSpace: 'nowrap',
          }}
        >
          MAIN THREAD
        </div>

        <div
          className="relative flex justify-between items-start"
          style={{ zIndex: 1, marginBottom: '14px' }}
        >
          <div
            style={{
              color: activeSave ? '#7a2020' : '#948879',
              fontSize: '13px',
              letterSpacing: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
            }}
          >
            <div
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: activeSave ? '#7a2020' : '#948879',
                boxShadow: activeSave ? '0 0 0 7px rgba(122,32,32,0.07)' : 'none',
              }}
            />
            {statusText}
          </div>
          <div
            style={{
              textAlign: 'right',
              color: '#948879',
              fontSize: '12px',
              letterSpacing: '2px',
              lineHeight: '1.6',
            }}
          >
            {worldDisplay}
            <strong
              style={{
                display: 'block',
                color: '#221d18',
                fontSize: '22px',
                fontWeight: 300,
                letterSpacing: '1px',
              }}
            >
              {stageRoman}
            </strong>
          </div>
        </div>

        <h2
          className="relative"
          style={{
            zIndex: 1,
            margin: '0 0 10px',
            fontWeight: 400,
            fontSize: '36px',
            lineHeight: '1.06',
            letterSpacing: '5px',
            color: '#221d18',
          }}
        >
          {loadingSave ? '加载中...' : (activeSave?.character.name || '无名者')}
        </h2>

        <p
          className="relative"
          style={{
            zIndex: 1,
            margin: 0,
            color: '#5a5047',
            fontSize: '14px',
            lineHeight: '1.75',
            letterSpacing: '1px',
          }}
        >
          {description}
        </p>

        {activeSave && (
          <div
            className="relative"
            style={{
              zIndex: 1,
              margin: '14px 0 12px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="命运线进度"
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '50%',
                height: '1px',
                background: 'rgba(34,29,24,0.16)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: `${progress}%`,
                  height: '1px',
                  background: '#7a2020',
                }}
              />
            </div>

            {['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'].map((node, i) => (
              <div
                key={i}
                style={{
                  position: 'relative',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  border: '1px solid',
                  borderColor: i === stageIndex ? '#7a2020' : 'rgba(34,29,24,0.25)',
                  background: '#eee9df',
                  marginRight: i === 4 ? 0 : 'auto',
                  display: 'grid',
                  placeItems: 'center',
                  color: i === stageIndex ? '#7a2020' : '#948879',
                  fontSize: '11px',
                  boxShadow: i === stageIndex ? '0 0 0 7px rgba(122,32,32,0.07)' : 'none',
                }}
              >
                {node}
              </div>
            ))}
          </div>
        )}

        <div
          className="relative grid"
          style={{
            zIndex: 1,
            gridTemplateColumns: 'repeat(4, 1fr)',
            borderTop: '1px solid rgba(34,29,24,0.13)',
            borderBottom: '1px solid rgba(34,29,24,0.13)',
            marginBottom: '12px',
          }}
        >
          {metrics.map((metric, i) => (
            <div
              key={i}
              style={{
                padding: '9px 0 8px',
                textAlign: 'center',
                borderRight:
                  i < 3 ? '1px solid rgba(34,29,24,0.13)' : 'none',
              }}
            >
              <b
                style={{
                  display: 'block',
                  fontSize: '23px',
                  lineHeight: 1,
                  fontWeight: 300,
                  color: '#221d18',
                }}
              >
                {metric.value}
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
                {metric.label}
              </span>
            </div>
          ))}
        </div>
      </article>

      <div
        className="grid"
        style={{ gridTemplateColumns: '1fr 1fr', gap: '11px', marginBottom: '14px' }}
      >
        <button
          onClick={handleContinue}
          disabled={loading || !activeSave}
          style={{
            height: '54px',
            border: 'none',
            background: activeSave ? '#221d18' : 'rgba(34,29,24,0.12)',
            color: activeSave ? '#f8f4ec' : '#948879',
            fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
            fontSize: '16px',
            letterSpacing: '5px',
            cursor: loading || !activeSave ? 'not-allowed' : 'pointer',
            transition: 'all 0.25s ease',
            opacity: loading ? 0.6 : 1,
          }}
          onMouseDown={(e) => {
            if (loading || !activeSave) return;
            e.currentTarget.style.background = '#7a2020';
            e.currentTarget.style.transform = 'translateY(2px)';
          }}
          onMouseUp={(e) => {
            if (loading || !activeSave) return;
            e.currentTarget.style.background = '#221d18';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          onMouseLeave={(e) => {
            if (loading || !activeSave) return;
            e.currentTarget.style.background = '#221d18';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {loading ? '加载中...' : activeSave ? '继续此生' : '无存档'}
        </button>

        <NewLifeButton />
      </div>

      <article
        style={{
          position: 'relative',
          padding: '14px 16px 14px 18px',
          borderLeft: '1px solid #7a2020',
          background: 'rgba(248,244,236,0.20)',
          marginBottom: '6px',
        }}
      >
        <div
          className="flex justify-between"
          style={{
            color: '#948879',
            fontSize: '12px',
            letterSpacing: '2px',
            marginBottom: '8px',
          }}
        >
          <span>Daily Prophecy</span>
          <span>今日谶语</span>
        </div>
        <p
          style={{
            margin: 0,
            color: '#5a5047',
            fontSize: '13px',
            lineHeight: '1.75',
            letterSpacing: '1px',
          }}
        >
          命运不是一扇门，而是一条逐渐收紧的线。你每一次迟疑，都会成为后来故事的形状。
        </p>
      </article>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
