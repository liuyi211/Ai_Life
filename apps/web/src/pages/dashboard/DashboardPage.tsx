import { useState, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import Sigil from './components/Sigil';
import TopBar from './components/TopBar';
import HeroSection from './components/HeroSection';
import BottomNav from './components/BottomNav';
import Sheet from './components/Sheet';
import Toast from './components/Toast';
import HomeTab from './components/HomeTab';
import ArchiveTab from './components/ArchiveTab';
import CodexTab from './components/CodexTab';
import ProfileTab from './components/ProfileTab';

export type TabName = 'home' | 'archive' | 'codex' | 'profile';

interface PageMeta {
  title: string;
  subtitle: string;
  mark: string;
}

const PAGE_META: Record<TabName, PageMeta> = {
  home: { title: '命运主厅', subtitle: '诸生命线，于此垂落', mark: 'Oracle Temple' },
  archive: { title: '人生档案', subtitle: '所有过往，皆有回声', mark: 'Archive Hall' },
  codex: { title: '世界图鉴', subtitle: '理解规则，才能改写因果', mark: 'Codex Chamber' },
  profile: { title: '账户', subtitle: '你的回响，被命运记住', mark: 'Soul Chamber' },
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTitle, setSheetTitle] = useState('');
  const [sheetText, setSheetText] = useState('');
  const [toastText, setToastText] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useState<ReturnType<typeof setTimeout> | null>(null);

  const logout = useAuthStore((state) => state.logout);

  const showToast = useCallback((text: string) => {
    setToastText(text);
    setToastVisible(true);
    if (toastTimerRef[0]) clearTimeout(toastTimerRef[0]);
    const timer = setTimeout(() => setToastVisible(false), 1400);
    toastTimerRef[1](timer);
  }, [toastTimerRef]);

  const openSheet = useCallback((title: string, text: string) => {
    setSheetTitle(title);
    setSheetText(text);
    setSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
  }, []);

  const switchTab = useCallback((tab: TabName) => {
    setActiveTab(tab);
    showToast('切换至：' + PAGE_META[tab].title);
  }, [showToast]);

  const handleEnterSheet = useCallback(() => {
    closeSheet();
    showToast('进入：' + sheetTitle);
  }, [closeSheet, showToast, sheetTitle]);

  const handleLogout = useCallback(() => {
    logout();
    showToast('已退出当前灵魂印记');
    window.location.href = '/login';
  }, [logout, showToast]);

  const meta = PAGE_META[activeTab];

  return (
    <div className="dashboard-page relative w-full h-screen flex flex-col overflow-hidden" style={{ padding: '30px 24px 22px', zIndex: 1 }}>
      <Sigil />

      <TopBar
        mark={meta.mark}
        onSoulClick={() => switchTab('profile')}
      />

      <HeroSection
        title={meta.title}
        subtitle={meta.subtitle}
      />

      <section className="scroll flex-1 min-h-0 overflow-y-auto" style={{ paddingRight: '3px' }}>
        {activeTab === 'home' && <HomeTab showToast={showToast} />}
        {activeTab === 'archive' && <ArchiveTab showToast={showToast} />}
        {activeTab === 'codex' && <CodexTab openSheet={openSheet} />}
        {activeTab === 'profile' && <ProfileTab openSheet={openSheet} onLogout={handleLogout} showToast={showToast} />}
      </section>

      <BottomNav activeTab={activeTab} onTabChange={switchTab} />

      <Sheet
        isOpen={sheetOpen}
        title={sheetTitle}
        text={sheetText}
        onClose={closeSheet}
        onEnter={handleEnterSheet}
      />

      <Toast text={toastText} visible={toastVisible} />

      <style>{`
        .dashboard-page { 
          background: var(--bg, #eee9df); 
        }
        .scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scroll::-webkit-scrollbar { 
          display: none; 
        }
        @media (max-width: 380px) {
          .dashboard-page { 
            padding-left: 18px !important; 
            padding-right: 18px !important; 
          }
        }
        @media (min-width: 768px) {
          body { 
            display: flex !important; 
            align-items: center !important; 
            justify-content: center !important; 
            background: #d4c8b8 !important; 
          }
          .dashboard-page { 
            width: 430px !important; 
            height: 860px !important; 
            max-height: 96vh !important; 
            background: #eee9df !important; 
            box-shadow: 0 30px 100px rgba(34,29,24,0.24) !important; 
          }
        }
      `}</style>
    </div>
  );
}
