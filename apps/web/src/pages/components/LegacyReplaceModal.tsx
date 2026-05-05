import { useState, useEffect, useCallback } from 'react';
import { legacyApi } from '../../services/api';

interface LegacyItem {
  name: string;
  desc: string;
  rarity?: string;
  source?: string;
}

interface LegacyReplaceModalProps {
  userLegacyCount: number;
  pendingLegacy: LegacyItem[];
  onClose: () => void;
  onDone: () => void;
}

export default function LegacyReplaceModal({
  userLegacyCount,
  pendingLegacy,
  onClose,
  onDone,
}: LegacyReplaceModalProps) {
  const [userLegacy, setUserLegacy] = useState<LegacyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const neededSpace = pendingLegacy.length;
  const maxCapacity = 10;
  const currentAfterAdd = userLegacyCount; // 这是实时的，会在删除后更新
  const spaceAvailable = maxCapacity - currentAfterAdd;
  const needToDelete = Math.max(0, neededSpace - spaceAvailable);

  const loadLegacy = useCallback(async () => {
    setLoading(true);
    try {
      const res = await legacyApi.list();
      if (res.data.success) {
        setUserLegacy(res.data.legacy || []);
      }
    } catch {
      // 忽略
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLegacy();
  }, [loadLegacy]);

  const handleDelete = async (name: string) => {
    if (deleting) return;
    setDeleting(name);
    try {
      const res = await legacyApi.remove(name);
      if (res.data.success) {
        setUserLegacy((prev) => prev.filter((l) => l.name !== name));
        // 通知父组件更新数量
        onDone();
      }
    } catch {
      // 忽略
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'rgba(34,29,24,0.45)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          maxHeight: '85vh',
          background: '#f0ebe3',
          borderTop: '1px solid rgba(34,29,24,0.18)',
          borderRadius: '16px 16px 0 0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px 14px',
            borderBottom: '1px solid rgba(34,29,24,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 400,
                letterSpacing: '3px',
                color: '#221d18',
              }}
            >
              遗产库已满
            </h3>
            <p
              style={{
                margin: '6px 0 0',
                color: '#7a2020',
                fontSize: '13px',
                letterSpacing: '1px',
                lineHeight: '1.5',
              }}
            >
              需要删除 {needToDelete} 项旧遗产，才能保存选中的 {pendingLegacy.length} 项新遗产
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              border: '1px solid rgba(34,29,24,0.15)',
              background: 'transparent',
              color: '#5a5047',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* 待保存的新遗产 */}
        {pendingLegacy.length > 0 && (
          <div
            style={{
              padding: '14px 20px',
              background: 'rgba(122,32,32,0.04)',
              borderBottom: '1px solid rgba(34,29,24,0.08)',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: '#7a2020',
                letterSpacing: '1px',
                marginBottom: '10px',
              }}
            >
              待保存的新遗产
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pendingLegacy.map((item) => (
                <div
                  key={item.name}
                  style={{
                    border: '1px solid rgba(122,32,32,0.2)',
                    background: 'rgba(122,32,32,0.03)',
                    padding: '10px 12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '14px',
                      color: '#221d18',
                      letterSpacing: '1px',
                      marginBottom: '4px',
                    }}
                  >
                    {item.name}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '11px',
                      color: '#948879',
                      lineHeight: '1.5',
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 当前遗产库 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px' }}>
          <div
            style={{
              fontSize: '12px',
              color: '#948879',
              letterSpacing: '1px',
              marginBottom: '12px',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>当前遗产库</span>
            <span>
              {userLegacy.length} / {maxCapacity}
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#948879', fontSize: '13px' }}>
              加载中...
            </div>
          ) : userLegacy.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#948879', fontSize: '13px' }}>
              遗产库为空
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {userLegacy.map((item) => (
                <div
                  key={item.name}
                  style={{
                    border: '1px solid rgba(34,29,24,0.13)',
                    background: '#f8f4ec',
                    padding: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#221d18',
                        letterSpacing: '1px',
                        marginBottom: '4px',
                      }}
                    >
                      {item.name}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '11px',
                        color: '#948879',
                        lineHeight: '1.5',
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(item.name)}
                    disabled={deleting === item.name}
                    style={{
                      border: '1px solid rgba(122,32,32,0.3)',
                      background: 'transparent',
                      color: '#7a2020',
                      fontSize: '11px',
                      letterSpacing: '1px',
                      padding: '5px 12px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      opacity: deleting === item.name ? 0.5 : 1,
                    }}
                  >
                    {deleting === item.name ? '删除中...' : '删除'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
