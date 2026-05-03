import type { TabName } from '../DashboardPage';

interface BottomNavProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

const NAV_ITEMS: { tab: TabName; label: string; symbol: string }[] = [
  { tab: 'home', label: '主厅', symbol: 'Ⅰ' },
  { tab: 'archive', label: '档案', symbol: 'Ⅱ' },
  { tab: 'codex', label: '图鉴', symbol: 'Ⅲ' },
  { tab: 'profile', label: '我的', symbol: 'Ⅳ' },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="grid"
      style={{
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '6px',
        paddingTop: '13px',
        borderTop: '1px solid rgba(34,29,24,0.13)',
      }}
    >
      {NAV_ITEMS.map((item) => (
        <button
          key={item.tab}
          onClick={() => onTabChange(item.tab)}
          style={{
            height: '52px',
            border: 'none',
            background: 'transparent',
            color: activeTab === item.tab ? '#7a2020' : '#948879',
            fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
            fontSize: '12px',
            letterSpacing: '2px',
            cursor: 'pointer',
            transition: 'color 0.25s ease',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '19px',
              marginBottom: '4px',
              lineHeight: 1,
            }}
          >
            {item.symbol}
          </span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
