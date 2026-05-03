import { useState, useEffect } from 'react';
import { aiApi } from '../../../services/api';

interface AIConfigSheetProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (text: string) => void;
}

const PROVIDERS = [
  { id: 'deepseek', name: 'DeepSeek' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'claude', name: 'Claude' },
  { id: 'custom', name: '自定义' },
];

type TestResult = { success: boolean; message: string } | null;

export default function AIConfigSheet({ isOpen, onClose, showToast }: AIConfigSheetProps) {
  const [provider, setProvider] = useState('deepseek');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [savedProvider, setSavedProvider] = useState('');
  const [savedModel, setSavedModel] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<TestResult>(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
      setTestResult(null);
      setApiKey('');
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await aiApi.getConfig();
      if (res.data.success) {
        const config = res.data.config;
        const p = config.provider || 'deepseek';
        setProvider(p);
        setSavedProvider(p);
        setModel(config.model || '');
        setSavedModel(config.model || '');
        setHasKey(config.hasApiKey);
      }
    } catch (err) {
      console.error('Load AI config error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!provider) {
      showToast('请选择 AI 提供商');
      return;
    }

    setSaving(true);
    setTestResult(null);
    try {
      await aiApi.updateConfig({
        provider,
        apiKey: apiKey || undefined,
        model: model || undefined,
      });
      showToast('配置已保存');
      setHasKey(true);
      setSavedProvider(provider);
      setSavedModel(model);
      setApiKey('');
    } catch (err: any) {
      showToast(err.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('确定要清除已保存的 API Key 吗？')) return;

    setClearing(true);
    setTestResult(null);
    try {
      await aiApi.clearConfig();
      showToast('API Key 已清除');
      setHasKey(false);
      setSavedProvider('');
      setSavedModel('');
      setApiKey('');
      setModel('');
    } catch (err: any) {
      showToast(err.response?.data?.message || '清除失败');
    } finally {
      setClearing(false);
    }
  };

  const handleTest = async () => {
    const testKey = apiKey.trim();
    if (!testKey && !hasKey) {
      showToast('请先输入 API Key');
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const res = await aiApi.testConnection(
        testKey
          ? { provider, apiKey: testKey, model: model || undefined }
          : undefined
      );
      if (res.data.success) {
        setTestResult({ success: true, message: res.data.message || '连接成功' });
        showToast('连接成功');
      } else {
        setTestResult({ success: false, message: res.data.message || '连接失败' });
        showToast(res.data.message || '连接失败');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || '连接失败，请检查网络或 API Key';
      setTestResult({ success: false, message: msg });
      showToast(msg);
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      style={{
        background: 'rgba(34,29,24,0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          maxHeight: '85vh',
          background: '#eee9df',
          borderTop: '1px solid rgba(34,29,24,0.28)',
          borderRadius: '24px 24px 0 0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid rgba(34,29,24,0.13)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 400,
                letterSpacing: '3px',
                color: '#221d18',
              }}
            >
              模型接入
            </h2>
            <p style={{ margin: '4px 0 0', color: '#948879', fontSize: '12px', letterSpacing: '1px' }}>
              配置 AI 提供商和 API Key
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              border: '1px solid rgba(34,29,24,0.28)',
              background: 'rgba(248,244,236,0.38)',
              color: '#221d18',
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
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#948879', padding: '40px 0' }}>加载中...</div>
          ) : (
            <>
              {/* 配置记录 */}
              {hasKey && (
                <div
                  style={{
                    marginBottom: '20px',
                    padding: '12px 16px',
                    background: 'rgba(248,244,236,0.50)',
                    border: '1px solid rgba(62,106,75,0.30)',
                  }}
                >
                  <div
                    style={{
                      color: '#3e6a4b',
                      fontSize: '12px',
                      letterSpacing: '2px',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3e6a4b' }} />
                    已配置
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '13px', color: '#5a5047' }}>
                      <span style={{ color: '#948879' }}>提供商：</span>
                      {PROVIDERS.find((p) => p.id === savedProvider)?.name || savedProvider}
                    </div>
                    {savedModel && (
                      <div style={{ fontSize: '13px', color: '#5a5047' }}>
                        <span style={{ color: '#948879' }}>模型：</span>
                        {savedModel}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleClear}
                    disabled={clearing}
                    style={{
                      marginTop: '10px',
                      padding: '8px 16px',
                      border: '1px solid rgba(122,32,32,0.30)',
                      background: 'transparent',
                      color: '#7a2020',
                      fontSize: '12px',
                      letterSpacing: '2px',
                      cursor: clearing ? 'not-allowed' : 'pointer',
                      opacity: clearing ? 0.6 : 1,
                    }}
                  >
                    {clearing ? '清除中...' : '清除配置'}
                  </button>
                </div>
              )}

              {/* Provider Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#948879',
                    fontSize: '12px',
                    letterSpacing: '2px',
                  }}
                >
                  AI 提供商
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(34,29,24,0.28)',
                    background: 'rgba(248,244,236,0.32)',
                    color: '#221d18',
                    fontSize: '14px',
                    fontFamily: "'Noto Serif SC', serif",
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model Input */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#948879',
                    fontSize: '12px',
                    letterSpacing: '2px',
                  }}
                >
                  模型
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="例如：deepseek-chat"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(34,29,24,0.28)',
                    background: 'rgba(248,244,236,0.32)',
                    color: '#221d18',
                    fontSize: '14px',
                    fontFamily: "'Noto Serif SC', serif",
                    outline: 'none',
                  }}
                />
              </div>

              {/* API Key Input */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#948879',
                    fontSize: '12px',
                    letterSpacing: '2px',
                  }}
                >
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasKey ? '已配置，输入新值可更换' : '输入您的 API Key'}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(34,29,24,0.28)',
                    background: 'rgba(248,244,236,0.32)',
                    color: '#221d18',
                    fontSize: '14px',
                    fontFamily: "'Noto Serif SC', serif",
                    outline: 'none',
                  }}
                />
                <p style={{ margin: '6px 0 0', color: '#948879', fontSize: '11px' }}>
                  API Key 将加密存储在数据库中
                </p>
              </div>

              {/* 测试结果 */}
              {testResult && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '12px 16px',
                    background: testResult.success
                      ? 'rgba(62,106,75,0.08)'
                      : 'rgba(122,32,32,0.08)',
                    border: `1px solid ${testResult.success
                      ? 'rgba(62,106,75,0.30)'
                      : 'rgba(122,32,32,0.30)'
                    }`,
                  }}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      color: testResult.success ? '#3e6a4b' : '#7a2020',
                      letterSpacing: '1px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>
                      {testResult.success ? '✓' : '✗'}
                    </span>
                    {testResult.message}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={handleTest}
                  disabled={testing}
                  style={{
                    padding: '14px',
                    border: '1px solid rgba(34,29,24,0.28)',
                    background: testing
                      ? 'rgba(248,244,236,0.20)'
                      : 'rgba(248,244,236,0.32)',
                    color: '#221d18',
                    fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
                    fontSize: '15px',
                    letterSpacing: '3px',
                    cursor: testing ? 'not-allowed' : 'pointer',
                    opacity: testing ? 0.6 : 1,
                  }}
                >
                  {testing ? '测试中...' : '测试连接'}
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '14px',
                    border: 'none',
                    background: '#221d18',
                    color: '#f8f4ec',
                    fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
                    fontSize: '15px',
                    letterSpacing: '3px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? '保存中...' : '保存配置'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
