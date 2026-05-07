import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveApi } from '../../../services/api';

interface ArchiveTabProps {
  showToast: (text: string) => void;
}

interface SaveItem {
  id: string;
  character: {
    name: string;
    world: string;
    age: number | string;
    lifeStage?: string;
    isAlive?: boolean;
  };
  history: Array<{ year: number; narrative: string; choice: string }>;
  gameStatus: string;
  updatedAt: string;
}

export default function ArchiveTab({ showToast }: ArchiveTabProps) {
  const navigate = useNavigate();
  const [saves, setSaves] = useState<SaveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadSaves();
  }, []);

  const loadSaves = async () => {
    setLoading(true);
    try {
      const res = await saveApi.list();
      if (res.data.success) {
        setSaves(res.data.saves || []);
      }
    } catch (err) {
      showToast('加载存档列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async (saveId: string) => {
    navigate(`/game?saveId=${saveId}`);
  };

  const handleDelete = async (saveId: string) => {
    if (!window.confirm('确定要删除这个存档吗？此操作不可撤销。')) return;

    setDeletingId(saveId);
    try {
      await saveApi.delete(saveId);
      showToast('存档已删除');
      setSaves((prev) => prev.filter((s) => s.id !== saveId));
    } catch {
      showToast('删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusText = (status: string, isAlive?: boolean) => {
    if (status === 'dead') return '已终结';
    if (!isAlive) return '已终结';
    return '进行中';
  };

  const getStatusColor = (status: string, isAlive?: boolean) => {
    if (status === 'dead' || !isAlive) return '#948879';
    return '#7a2020';
  };

  const formatAge = (age: number | string) => {
    if (typeof age === 'number') return `${age} 岁`;
    return age;
  };

  if (loading) {
    return (
      <div className="tab-page active" style={{ animation: 'fadeUp .32s ease both' }}>
        <SectionHead cn="人生档案" en="Life Archive" />
        <div style={{ textAlign: 'center', color: '#948879', padding: '40px 0' }}>加载中...</div>
      </div>
    );
  }

  if (saves.length === 0) {
    return (
      <div className="tab-page active" style={{ animation: 'fadeUp .32s ease both' }}>
        <SectionHead cn="人生档案" en="Life Archive" />
        <div
          style={{
            textAlign: 'center',
            color: '#948879',
            padding: '60px 20px',
            border: '1px solid rgba(34,29,24,0.13)',
            background: 'rgba(248,244,236,0.30)',
          }}
        >
          <div style={{ fontSize: '14px', letterSpacing: '2px', marginBottom: '12px' }}>暂无存档</div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>创建一个新角色，开启你的命运之旅</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-page active" style={{ animation: 'fadeUp .32s ease both' }}>
      <SectionHead cn="人生档案" en="Life Archive" />

      <div style={{ borderTop: '1px solid rgba(34,29,24,0.13)', marginBottom: '18px' }}>
        {saves.map((save) => (
          <article
            key={save.id}
            className="grid"
            style={{
              gridTemplateColumns: '1fr auto',
              gap: '12px',
              alignItems: 'center',
              padding: '16px 0',
              borderBottom: '1px solid rgba(34,29,24,0.13)',
            }}
          >
            <div
              style={{ cursor: 'pointer' }}
              onClick={() => handleContinue(save.id)}
            >
              <div className="flex justify-between" style={{ marginBottom: '6px' }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 400,
                    letterSpacing: '2px',
                    color: '#221d18',
                  }}
                >
                  {save.character.name} · {save.character.world}
                </h3>
                <span
                  style={{
                    color: getStatusColor(save.gameStatus, save.character.isAlive),
                    fontSize: '12px',
                    letterSpacing: '2px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {getStatusText(save.gameStatus, save.character.isAlive)}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  color: '#948879',
                  fontSize: '12px',
                  letterSpacing: '1px',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                {formatAge(save.character.age)} / {save.history.length} 个时刻 / {new Date(save.updatedAt).toLocaleDateString('zh-CN')}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  if (save.gameStatus === 'dead' || !save.character.isAlive) {
                    navigate(`/settlement?saveId=${save.id}`);
                  } else {
                    handleContinue(save.id);
                  }
                }}
                style={{
                  padding: '8px 14px',
                  border: '1px solid rgba(34,29,24,0.28)',
                  background: 'rgba(248,244,236,0.32)',
                  color: '#221d18',
                  fontSize: '12px',
                  letterSpacing: '2px',
                  cursor: 'pointer',
                }}
              >
                {save.gameStatus === 'dead' || !save.character.isAlive ? '查看回响' : '进入'}
              </button>
              <button
                onClick={() => handleDelete(save.id)}
                disabled={deletingId === save.id}
                style={{
                  padding: '8px 14px',
                  border: '1px solid rgba(122,32,32,0.28)',
                  background: 'transparent',
                  color: '#7a2020',
                  fontSize: '12px',
                  letterSpacing: '2px',
                  cursor: deletingId === save.id ? 'not-allowed' : 'pointer',
                  opacity: deletingId === save.id ? 0.6 : 1,
                }}
              >
                {deletingId === save.id ? '删除中...' : '删除'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function SectionHead({ cn, en }: { cn: string; en: string }) {
  return (
    <div
      className="flex justify-between items-end"
      style={{ margin: '0 0 13px' }}
    >
      <span style={{ fontSize: '16px', letterSpacing: '3px', color: '#221d18' }}>
        {cn}
      </span>
      <span
        style={{
          fontSize: '13px',
          letterSpacing: '2px',
          color: '#948879',
          fontStyle: 'italic',
        }}
      >
        {en}
      </span>
    </div>
  );
}
