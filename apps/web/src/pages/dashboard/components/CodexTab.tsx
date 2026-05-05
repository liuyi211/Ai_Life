import { useState } from 'react';
import { aiApi } from '../../../services/api';
import { useWorldStore, type WorldData } from '../../../stores/worldStore';

// ==================== 表单数据类型 ====================

interface CustomWorldForm {
  name: string;
  type: string;
  races: string;
  era: string;
  conflict: string;
  powerSystem: string;
  factions: string;
}

const DEFAULT_FORM: CustomWorldForm = {
  name: '',
  type: '',
  races: '',
  era: '',
  conflict: '',
  powerSystem: '',
  factions: '',
};

// ==================== 主组件 ====================

export default function CodexTab() {
  const { presetWorlds, customWorlds, addCustomWorld, removeCustomWorld } = useWorldStore();
  const [activeWorld, setActiveWorld] = useState<WorldData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CustomWorldForm>({ ...DEFAULT_FORM });
  const [generating, setGenerating] = useState(false);
  const [formError, setFormError] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; world: WorldData } | null>(null);

  const allWorlds = [...presetWorlds, ...customWorlds];

  const updateForm = (key: keyof CustomWorldForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formError) setFormError('');
  };

  const handleGenerate = async () => {
    if (!form.name.trim() || !form.type.trim()) {
      setFormError('世界名称和类型为必填项');
      return;
    }

    setGenerating(true);
    setFormError('');

    try {
      const res = await aiApi.generateWorld({
        name: form.name,
        type: form.type,
        races: form.races,
        era: form.era,
        conflict: form.conflict,
        powerSystem: form.powerSystem,
        factions: form.factions,
      });

      if (res.data.success) {
        const customId = `custom_${Date.now()}`;
        const customMark = `${customWorlds.length + 1}`;

        const newWorld: WorldData = {
          id: customId,
          name: form.name,
          mark: customMark,
          tag: form.type,
          tagEn: '自定义 / Custom',
          code: form.name,
          brief: `${form.type}风格世界。${form.conflict || '未知冲突'}。`,
          desc: res.data.description.slice(0, 60),
          description: res.data.description,
          tags: res.data.tags || [form.type],
          chips: res.data.chips || ['自定义'],
          detailDesc: res.data.description,
          configOptions: res.data.configOptions || ['平民出身', '贵族血脉', '流浪者'],
          talentPool: res.data.talents || [],
          isCustom: true,
        };

        addCustomWorld(newWorld);
        setShowForm(false);
        setForm({ ...DEFAULT_FORM });
        // 自动打开新生成世界的详情
        setActiveWorld(newWorld);
      } else {
        setFormError(res.data.message || '生成失败');
      }
    } catch {
      setFormError('生成失败，请检查 AI 配置');
    } finally {
      setGenerating(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setForm({ ...DEFAULT_FORM });
    setFormError('');
  };

  return (
    <div className="tab-page active" style={{ animation: 'fadeUp .32s ease both' }}>
      <SectionHead cn="世界图鉴" en="World Codex" />

      {/* 世界卡片网格 */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {/* 自定义图鉴入口卡片 */}
        <article
          className="relative"
          style={{
            minHeight: '118px',
            padding: '14px 13px',
            border: '1px solid rgba(122,32,32,0.25)',
            background: 'rgba(122,32,32,0.03)',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.26s ease',
          }}
          onClick={() => setShowForm(true)}
        >
          <div
            style={{
              position: 'absolute',
              right: '9px',
              top: '6px',
              color: 'rgba(122,32,32,0.12)',
              fontSize: '42px',
              lineHeight: 1,
              fontWeight: 300,
              fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
              letterSpacing: '2px',
              pointerEvents: 'none',
            }}
          >
            +
          </div>

          <span
            style={{
              display: 'inline-block',
              marginBottom: '10px',
              color: '#7a2020',
              fontSize: '11px',
              letterSpacing: '2px',
            }}
          >
            Custom
          </span>

          <h3
            style={{
              margin: '0 0 7px',
              fontSize: '17px',
              fontWeight: 400,
              letterSpacing: '2px',
              color: '#221d18',
              lineHeight: 1.3,
            }}
          >
            自定义图鉴
          </h3>

          <p
            style={{
              margin: 0,
              color: '#948879',
              fontSize: '12px',
              lineHeight: '1.65',
              letterSpacing: '0.5px',
              maxWidth: '92%',
            }}
          >
            填写设定，AI 生成专属世界。
          </p>
        </article>

        {/* 预设世界卡片 */}
        {allWorlds.map((world) => (
          <article
            key={world.id}
            className="relative"
            style={{
              minHeight: '118px',
              padding: '14px 13px',
              border: '1px solid rgba(34,29,24,0.13)',
              background: 'rgba(248,244,236,0.26)',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.26s ease',
            }}
            onClick={() => setActiveWorld(world)}
            onContextMenu={(e) => {
              if (world.isCustom) {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, world });
              }
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: '9px',
                top: '6px',
                color: 'rgba(34,29,24,0.055)',
                fontSize: '42px',
                lineHeight: 1,
                fontWeight: 300,
                fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
                letterSpacing: '2px',
                pointerEvents: 'none',
              }}
            >
              {world.mark}
            </div>

            <span
              style={{
                display: 'inline-block',
                marginBottom: '10px',
                color: '#7a2020',
                fontSize: '11px',
                letterSpacing: '2px',
              }}
            >
              {world.isCustom ? 'Custom' : 'World'}
            </span>

            <h3
              style={{
                margin: '0 0 7px',
                fontSize: '17px',
                fontWeight: 400,
                letterSpacing: '2px',
                color: '#221d18',
                lineHeight: 1.3,
              }}
            >
              {world.name}
            </h3>

            <p
              style={{
                margin: 0,
                color: '#948879',
                fontSize: '12px',
                lineHeight: '1.65',
                letterSpacing: '0.5px',
                maxWidth: '92%',
              }}
            >
              {world.brief}
            </p>
          </article>
        ))}
      </div>

      {/* 世界详情弹窗 */}
      {activeWorld && (
        <DetailModal world={activeWorld} onClose={() => setActiveWorld(null)} />
      )}

      {/* 自定义图鉴表单弹窗 */}
      {showForm && (
        <FormModal
          form={form}
          generating={generating}
          error={formError}
          onChange={updateForm}
          onGenerate={handleGenerate}
          onClose={handleCloseForm}
        />
      )}

      {/* 右键删除菜单 */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 50,
            background: '#f3eddf',
            border: '1px solid rgba(34,29,24,0.2)',
            boxShadow: '0 8px 32px rgba(34,29,24,0.15)',
            padding: '4px 0',
            minWidth: '120px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              removeCustomWorld(contextMenu.world.id);
              setContextMenu(null);
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              color: '#7a2020',
              fontSize: '13px',
              letterSpacing: '1px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(122,32,32,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            删除世界
          </button>
        </div>
      )}

      {/* 点击空白处关闭右键菜单 */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
          }}
          onClick={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

// ==================== 详情弹窗 ====================

function DetailModal({ world, onClose }: { world: WorldData; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20,
        background: 'rgba(34,29,24,0.22)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <section
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          left: '12px',
          right: '12px',
          bottom: '12px',
          background: '#f3eddf',
          border: '1px solid rgba(34,29,24,0.24)',
          boxShadow: '0 -20px 70px rgba(34,29,24,0.20)',
          padding: '22px 20px 20px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '10px',
            border: '1px solid rgba(34,29,24,0.08)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            width: '42px',
            height: '4px',
            background: 'rgba(34,29,24,0.18)',
            margin: '0 auto 20px',
          }}
        />

        <div style={{ marginBottom: '12px' }}>
          {world.tags.map((tag: string, i: number) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                marginRight: '8px',
                marginBottom: '6px',
                padding: '3px 10px',
                border: '1px solid rgba(122,32,32,0.25)',
                color: '#7a2020',
                fontSize: '11px',
                letterSpacing: '1px',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <h2
          style={{
            margin: '0 0 12px',
            fontSize: '27px',
            fontWeight: 400,
            letterSpacing: '4px',
            color: '#221d18',
          }}
        >
          {world.name}
        </h2>

        <p
          style={{
            margin: '0 0 20px',
            color: '#5a5047',
            fontSize: '14px',
            lineHeight: '1.9',
            letterSpacing: '1px',
          }}
        >
          {world.description}
        </p>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            height: '52px',
            border: '1px solid rgba(34,29,24,0.28)',
            background: 'transparent',
            fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
            fontSize: '15px',
            letterSpacing: '3px',
            color: '#221d18',
            cursor: 'pointer',
          }}
        >
          返回
        </button>
      </section>

      <style>{`
        @media (min-width: 768px) {
          section[style*="bottom: 12px"] {
            width: 406px !important;
            left: auto !important;
            right: auto !important;
            bottom: calc(50% - 200px) !important;
          }
        }
      `}</style>
    </div>
  );
}

// ==================== 表单弹窗 ====================

function FormModal({
  form,
  generating,
  error,
  onChange,
  onGenerate,
  onClose,
}: {
  form: CustomWorldForm;
  generating: boolean;
  error: string;
  onChange: (key: keyof CustomWorldForm, value: string) => void;
  onGenerate: () => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20,
        background: 'rgba(34,29,24,0.22)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <section
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          left: '12px',
          right: '12px',
          bottom: '12px',
          background: '#f3eddf',
          border: '1px solid rgba(34,29,24,0.24)',
          boxShadow: '0 -20px 70px rgba(34,29,24,0.20)',
          padding: '22px 20px 20px',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '10px',
            border: '1px solid rgba(34,29,24,0.08)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            width: '42px',
            height: '4px',
            background: 'rgba(34,29,24,0.18)',
            margin: '0 auto 20px',
          }}
        />

        <h2
          style={{
            margin: '0 0 16px',
            fontSize: '24px',
            fontWeight: 400,
            letterSpacing: '3px',
            color: '#221d18',
          }}
        >
          自定义图鉴
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
          <FormField
            label="世界名称 *"
            value={form.name}
            onChange={(v) => onChange('name', v)}
            placeholder="例如：蒸汽王朝、星历纪元"
          />
          <FormField
            label="世界类型 *"
            value={form.type}
            onChange={(v) => onChange('type', v)}
            placeholder="例如：蒸汽奇幻、星际王朝、末世废土"
          />
          <FormField
            label="主要种族"
            value={form.races}
            onChange={(v) => onChange('races', v)}
            placeholder="例如：人族、龙裔、妖族、机械生命"
          />
          <FormField
            label="时代背景"
            value={form.era}
            onChange={(v) => onChange('era', v)}
            placeholder="例如：王朝末年、星历4037年、公司城时代"
          />
          <FormField
            label="核心冲突"
            value={form.conflict}
            onChange={(v) => onChange('conflict', v)}
            placeholder="例如：资源争夺、信仰战争、阶级压迫"
          />
          <FormField
            label="力量体系"
            value={form.powerSystem}
            onChange={(v) => onChange('powerSystem', v)}
            placeholder="例如：灵力、科技、信仰、血脉"
          />
          <FormField
            label="主要阵营"
            value={form.factions}
            onChange={(v) => onChange('factions', v)}
            placeholder="例如：帝国、商会、反抗军、教廷"
          />
        </div>

        {generating && (
          <div
            style={{
              margin: '0 0 16px',
              padding: '12px 14px',
              border: '1px solid rgba(122,32,32,0.2)',
              background: 'rgba(122,32,32,0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                width: '14px',
                height: '14px',
                border: '1.5px solid rgba(122,32,32,0.2)',
                borderTopColor: '#7a2020',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                color: '#7a2020',
                fontSize: '13px',
                letterSpacing: '1.5px',
              }}
            >
              正在生成世界设定，请稍候...
            </span>
          </div>
        )}

        {error && (
          <p
            style={{
              margin: '0 0 12px',
              color: '#7a2020',
              fontSize: '12px',
              letterSpacing: '1px',
            }}
          >
            {error}
          </p>
        )}

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              height: '52px',
              border: '1px solid rgba(34,29,24,0.28)',
              background: 'transparent',
              fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
              fontSize: '15px',
              letterSpacing: '3px',
              color: '#221d18',
              cursor: 'pointer',
            }}
          >
            返回
          </button>
          <button
            onClick={onGenerate}
            disabled={generating}
            style={{
              height: '52px',
              border: '1px solid #221d18',
              background: generating ? 'rgba(34,29,24,0.3)' : '#221d18',
              fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
              fontSize: '15px',
              letterSpacing: '3px',
              color: '#f8f4ec',
              cursor: generating ? 'not-allowed' : 'pointer',
            }}
          >
            {generating ? '正在生成世界' : '生成世界设定'}
          </button>
        </div>
      </section>

      <style>{`
        @media (min-width: 768px) {
          section[style*="bottom: 12px"] {
            width: 406px !important;
            left: auto !important;
            right: auto !important;
            bottom: calc(50% - 250px) !important;
          }
        }
      `}        </style>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
    </div>
  );
}

// ==================== 子组件 ====================

function SectionHead({ cn, en }: { cn: string; en: string }) {
  return (
    <div className="flex justify-between items-end" style={{ margin: '0 0 13px' }}>
      <span style={{ fontSize: '16px', letterSpacing: '3px', color: '#221d18' }}>{cn}</span>
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

function FormField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          marginBottom: '5px',
          color: '#948879',
          fontSize: '12px',
          letterSpacing: '2px',
        }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: '40px',
          padding: '0 12px',
          border: '1px solid rgba(34,29,24,0.18)',
          background: 'rgba(248,244,236,0.5)',
          color: '#221d18',
          fontSize: '13px',
          fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
          letterSpacing: '0.5px',
          outline: 'none',
          transition: 'border-color 0.2s ease',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'rgba(122,32,32,0.4)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(34,29,24,0.18)';
        }}
      />
    </div>
  );
}
