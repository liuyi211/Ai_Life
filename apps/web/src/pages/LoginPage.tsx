import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

function showToast(text: string, id = 'auth-toast') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1400);
}

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { showToast('请先输入灵魂印记'); return; }
    if (!password.trim()) { showToast('请先输入命运秘钥'); return; }

    setIsLoading(true);
    try {
      const response = await authApi.login(username, password);
      const { token, user } = response.data;
      login(token, user);
      showToast('命运门扉已开启');
      setTimeout(() => navigate('/'), 800);
    } catch (err: any) {
      showToast(err.response?.data?.message || '登录失败，请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuest = useCallback(() => {
    showToast('以访客身份进入命运主厅');
    setTimeout(() => navigate('/'), 800);
  }, [navigate]);

  return (
    <div className="auth-page relative w-full h-screen flex flex-col overflow-hidden" style={{ padding: '38px 26px 30px', zIndex: 1 }}>
      {/* Sigil */}
      <div className="absolute pointer-events-none" style={{ top: '84px', left: '50%', width: '342px', height: '342px', transform: 'translateX(-50%)', border: '1px solid rgba(34,29,24,0.08)', borderRadius: '50%', zIndex: -1, animation: 'breathe 5.8s ease-in-out infinite' }}>
        <div style={{ position: 'absolute', inset: '34px', borderRadius: '50%', border: '1px solid rgba(34,29,24,0.07)' }} />
        <div style={{ position: 'absolute', inset: '78px', borderRadius: '50%', border: '1px solid rgba(122,32,32,0.12)' }} />
        <div style={{ position: 'absolute', left: '50%', top: 0, width: '1px', height: '100%', background: 'rgba(34,29,24,0.045)', transformOrigin: 'center' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', background: 'rgba(34,29,24,0.045)', transform: 'rotate(60deg)' }} />
          <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', background: 'rgba(34,29,24,0.045)', transform: 'rotate(-60deg)' }} />
        </div>
      </div>

      {/* Toast */}
      <div id="auth-toast" style={{ position: 'fixed', left: '50%', bottom: '120px', transform: 'translateX(-50%) translateY(14px)', opacity: 0, zIndex: 30, pointerEvents: 'none', background: 'rgba(34,29,24,0.92)', color: '#f8f4ec', padding: '11px 17px', fontSize: '13px', letterSpacing: '2px', transition: 'all 0.24s ease', whiteSpace: 'nowrap' }} />

      {/* Topbar */}
      <header>
        <div className="flex justify-between items-start" style={{ marginBottom: '42px' }}>
          <div className="flex items-center" style={{ gap: '12px', color: '#948879', fontSize: '15px', letterSpacing: '2px', fontStyle: 'italic' }}>
            <div style={{ width: '26px', height: '1px', background: 'rgba(34,29,24,0.35)' }} />
            Oracle Gate
          </div>
          <div className="relative grid place-items-center" style={{ width: '52px', height: '64px', border: '1px solid rgba(34,29,24,0.28)', borderRadius: '999px 999px 22px 22px', background: 'rgba(248,244,236,0.38)', color: '#7a2020', fontSize: '18px', boxShadow: '0 12px 34px rgba(34,29,24,0.08)' }}>
            <div className="absolute" style={{ inset: '7px', border: '1px solid rgba(122,32,32,0.16)', borderRadius: 'inherit' }} />
            命
          </div>
        </div>
        <section style={{ marginBottom: '28px' }}>
          <h1 style={{ margin: '0 0 12px', fontSize: '48px', lineHeight: '1.02', fontWeight: 400, letterSpacing: '10px', color: '#221d18' }}>人生回响</h1>
          <p style={{ margin: 0, color: '#948879', fontSize: '14px', letterSpacing: '4px' }}>AI 驱动的无限命运模拟</p>
        </section>
      </header>

      {/* Login Card */}
      <section className="relative" style={{ height: '430px', flex: '0 0 430px', padding: '24px 20px 22px', border: '1px solid rgba(34,29,24,0.28)', background: 'linear-gradient(180deg, rgba(248,244,236,0.60), rgba(238,233,223,0.36)), radial-gradient(circle at 50% 6%, rgba(159,124,62,0.15), transparent 35%)', boxShadow: '0 24px 70px rgba(34,29,24,0.13)', overflow: 'hidden' }}>
        <div className="absolute pointer-events-none" style={{ inset: '12px', border: '1px solid rgba(34,29,24,0.09)' }} />
        {[
          { left: '12px', top: '12px', borderLeft: '1px solid', borderTop: '1px solid' },
          { right: '12px', top: '12px', borderRight: '1px solid', borderTop: '1px solid' },
          { left: '12px', bottom: '12px', borderLeft: '1px solid', borderBottom: '1px solid' },
          { right: '12px', bottom: '12px', borderRight: '1px solid', borderBottom: '1px solid' },
        ].map((style, i) => (
          <span key={i} className="absolute pointer-events-none" style={{ width: '18px', height: '18px', borderColor: 'rgba(122,32,32,0.55)', opacity: 0.55, ...style }} />
        ))}
        <div className="absolute pointer-events-none" style={{ left: '50%', top: '118px', transform: 'translateX(-50%)', color: 'rgba(34,29,24,0.045)', fontSize: '34px', letterSpacing: '5px', whiteSpace: 'nowrap' }}>ACCESS TO DESTINY</div>

        {/* Card Head */}
        <div className="relative flex justify-between items-start" style={{ zIndex: 1, marginBottom: '26px' }}>
          <div className="flex items-center" style={{ gap: '9px', color: '#7a2020', fontSize: '13px', letterSpacing: '2px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#7a2020', boxShadow: '0 0 0 7px rgba(122,32,32,0.07)' }} />
            命运之门待启
          </div>
          <div style={{ textAlign: 'right', color: '#948879', fontSize: '12px', letterSpacing: '2px', lineHeight: '1.6' }}>
            ACCESS
            <strong style={{ display: 'block', color: '#221d18', fontSize: '24px', fontWeight: 300, letterSpacing: '1px' }}>I</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="relative" style={{ zIndex: 1, marginBottom: '22px' }}>
            <div className="flex justify-between items-end" style={{ marginBottom: '11px' }}>
              <span style={{ color: '#948879', fontSize: '14px', letterSpacing: '2px', fontStyle: 'italic' }}>01 / Soul Mark</span>
              <span style={{ color: '#221d18', fontSize: '15px', letterSpacing: '3px' }}>灵魂印记</span>
            </div>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="输入您的账户名" autoComplete="username"
              style={{ width: '100%', border: 'none', borderBottom: '1px solid rgba(34,29,24,0.18)', background: 'transparent', padding: '7px 52px 13px 0', color: '#221d18', borderRadius: 0, fontSize: '21px', fontWeight: 400, transition: 'all 0.35s ease', outline: 'none' }}
              onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#7a2020'; e.currentTarget.style.paddingLeft = '8px'; }}
              onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(34,29,24,0.18)'; e.currentTarget.style.paddingLeft = '0'; }}
            />
          </div>
          <div className="relative" style={{ zIndex: 1, marginBottom: '22px' }}>
            <div className="flex justify-between items-end" style={{ marginBottom: '11px' }}>
              <span style={{ color: '#948879', fontSize: '14px', letterSpacing: '2px', fontStyle: 'italic' }}>02 / Secret Thread</span>
              <span style={{ color: '#221d18', fontSize: '15px', letterSpacing: '3px' }}>命运秘钥</span>
            </div>
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="输入您的密码" autoComplete="current-password"
              style={{ width: '100%', border: 'none', borderBottom: '1px solid rgba(34,29,24,0.18)', background: 'transparent', padding: '7px 52px 13px 0', color: '#221d18', borderRadius: 0, fontSize: '21px', fontWeight: 400, transition: 'all 0.35s ease', outline: 'none' }}
              onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#7a2020'; e.currentTarget.style.paddingLeft = '8px'; }}
              onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(34,29,24,0.18)'; e.currentTarget.style.paddingLeft = '0'; }}
            />
            <span className="absolute cursor-pointer select-none" style={{ right: 0, bottom: '13px', color: showPassword ? '#7a2020' : '#948879', fontSize: '13px', letterSpacing: '2px', transition: 'color 0.25s ease' }} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? '[ 显 ]' : '[ 隐 ]'}
            </span>
          </div>
          <div className="relative" style={{ zIndex: 1, margin: '4px 0 0', padding: '2px 0 0' }}>
            <p style={{ margin: 0, color: '#5a5047', fontFamily: "'Noto Serif SC', serif", fontSize: '13px', lineHeight: '1.9', letterSpacing: '1px' }}>每一次进入，都是命线重新垂落的瞬间。</p>
            <p style={{ margin: '6px 0 0', color: '#948879', fontFamily: "'Noto Serif SC', serif", fontSize: '13px', lineHeight: '1.9', letterSpacing: '1px' }}>旧日选择并未消失，它沉于因果之河，待下次回响。</p>
          </div>
        </form>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: '18px', minHeight: '118px', flex: '0 0 118px' }}>
        <button type="button" onClick={handleSubmit} disabled={isLoading}
          style={{ width: '100%', height: '62px', border: 'none', background: '#221d18', color: '#f8f4ec', fontSize: '16px', letterSpacing: '7px', cursor: 'pointer', transition: 'all 0.25s ease' }}
          onMouseDown={(e) => { e.currentTarget.style.background = '#7a2020'; e.currentTarget.style.transform = 'translateY(2px)'; }}
          onMouseUp={(e) => { e.currentTarget.style.background = '#221d18'; e.currentTarget.style.transform = 'translateY(0)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#221d18'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {isLoading ? '连接中...' : '开启命运'}
        </button>
        <div className="flex justify-between items-center" style={{ marginTop: '24px', color: '#948879', fontSize: '14px', letterSpacing: '1px', gap: '12px' }}>
          <span style={{ minWidth: 0, whiteSpace: 'nowrap' }}>尚未铭刻灵魂印记？</span>
          <div className="flex items-center" style={{ justifyContent: 'flex-end', gap: '14px', whiteSpace: 'nowrap' }}>
            <button type="button" onClick={handleGuest}
              style={{ color: '#948879', textDecoration: 'none', paddingBottom: '2px', letterSpacing: '2px', background: 'none', border: 'none', borderBottom: '1px solid rgba(148,136,121,0.32)', cursor: 'pointer', fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif" }}
            >访客登录</button>
            <Link to="/register"
              style={{ color: '#221d18', textDecoration: 'none', borderBottom: '1px solid rgba(34,29,24,0.28)', paddingBottom: '2px', letterSpacing: '2px' }}
            >创建命运</Link>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 380px) {
          .auth-page { padding-left: 22px !important; padding-right: 22px !important; }
          .auth-page h1 { font-size: 44px !important; letter-spacing: 8px !important; }
        }
        @media (min-width: 768px) {
          body { display: flex !important; align-items: center !important; justify-content: center !important; background: #d4c8b8 !important; }
          .auth-page { width: 430px !important; height: 860px !important; max-height: 96vh !important; background: #eee9df !important; box-shadow: 0 30px 100px rgba(34,29,24,0.24) !important; }
          #auth-toast { bottom: calc(50% - 370px) !important; }
        }
      `}</style>
    </div>
  );
}
