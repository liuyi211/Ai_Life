import { useState, useEffect, useCallback } from 'react';
import { legacyApi } from '../../../services/api';

interface LegacySheetProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (text: string) => void;
}

interface LegacyItem {
  name: string;
  desc: string;
  rarity?: string;
  mark?: string;
  source?: string;
}

export default function LegacySheet({ isOpen, onClose, showToast }: LegacySheetProps) {
  const [legacy, setLegacy] = useState<LegacyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadLegacy = useCallback(async () => {
    setLoading(true);
    try {
      const res = await legacyApi.list();
      if (res.data.success) {
        setLegacy(res.data.legacy || []);
      }
    } catch {
      showToast('加载遗产失败');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isOpen) {
      loadLegacy();
    }
  }, [isOpen, loadLegacy]);

  const handleDelete = async (name: string) => {
    setDeleting(name);
    try {
      const res = await legacyApi.remove(name);
      if (res.data.success) {
        setLegacy((prev) => prev.filter((l) => l.name !== name));
        showToast('遗产已删除');
      }
    } catch {
      showToast('删除失败');
    } finally {
      setDeleting(null);
    }
  };

  if (!isOpen) return null;

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
          maxHeight: '80vh',
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
              继承遗产
            </h3>
            <p
              style={{
                margin: '4px 0 0',
                color: '#948879',
                fontSize: '12px',
                letterSpacing: '1px',
              }}
            >
              上限 {legacy.length} / 10 · 创建角色时可选择 2 项带入新人生
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
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#948879', fontSize: '13px' }}>
              加载中...
            </div>
          ) : legacy.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#948879', fontSize: '13px', lineHeight: '1.8' }}>
              <p>暂无遗产</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>完成一次人生轮回后将自动保存遗产</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {legacy.map((item) => (
                <div
                  key={item.name}
                  style={{
                    border: '1px solid rgba(34,29,24,0.13)',
                    background: '#f8f4ec',
                    padding: '14px 12px',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div>
                      <div style={{ color: '#7a2020', fontSize: '11px', letterSpacing: '1.5px', marginBottom: '4px' }}>
                        {item.rarity || '普通'}
                      </div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '16px',
                          fontWeight: 400,
                          letterSpacing: '2px',
                          color: '#221d18',
                        }}
                      >
                        {item.name}
                      </h4>
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
                        padding: '4px 10px',
                        cursor: 'pointer',
                        opacity: deleting === item.name ? 0.5 : 1,
                      }}
                    >
                      {deleting === item.name ? '删除中...' : '删除'}
                    </button>
                  </div>
                  <p
                    style={{
                      margin: '0 0 8px',
                      color: '#5a5047',
                      fontSize: '12px',
                      lineHeight: '1.6',
                      letterSpacing: '.5px',
                    }}
                  >
                    {item.desc}
                  </p>
                  <span
                    style={{
                      color: '#948879',
                      fontSize: '11px',
                      letterSpacing: '1px',
                    }}
                  >
                    {item.source || '旧生遗产'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
