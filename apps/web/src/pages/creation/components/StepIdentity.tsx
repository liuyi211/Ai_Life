import type { CreationForm } from '../data';
import { AGES, GENDERS, ATTR_CONFIG } from '../data';

interface StepIdentityProps {
  form: CreationForm;
  onChange: (updates: Partial<CreationForm>) => void;
  onAttrChange: (key: string, delta: number) => void;
}

export default function StepIdentity({ form, onChange, onAttrChange }: StepIdentityProps) {
  return (
    <div className="flex flex-col h-full" style={{ animation: 'fadeUp .34s ease both' }}>
      <div className="flex justify-between items-end" style={{ marginBottom: '11px' }}>
        <span style={{ color: '#221d18', fontSize: '16px', letterSpacing: '3px' }}>设定身份</span>
        <span style={{ color: '#948879', fontSize: '13px', letterSpacing: '2px', fontStyle: 'italic' }}>Identity Vessel</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto" style={{ paddingRight: '3px' }}>
        {/* Name */}
        <div style={{ marginBottom: '19px' }}>
          <div className="flex justify-between items-end" style={{ marginBottom: '9px' }}>
            <span style={{ color: '#948879', fontSize: '13px', letterSpacing: '2px', fontStyle: 'italic' }}>01 / Name</span>
            <span style={{ color: '#221d18', fontSize: '14px', letterSpacing: '2px' }}>姓名</span>
          </div>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="输入你的初始姓名，例如：周砚"
            style={{
              width: '100%',
              border: 'none',
              borderBottom: '1px solid rgba(34,29,24,0.18)',
              background: 'transparent',
              color: '#221d18',
              outline: 'none',
              borderRadius: 0,
              fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
              fontSize: '19px',
              fontWeight: 400,
              padding: '7px 0 13px',
              transition: '.32s ease',
            }}
            onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#7a2020'; e.currentTarget.style.paddingLeft = '8px'; }}
            onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(34,29,24,0.18)'; e.currentTarget.style.paddingLeft = '0'; }}
          />
        </div>

        {/* Gender */}
        <div style={{ marginBottom: '19px' }}>
          <div className="flex justify-between items-end" style={{ marginBottom: '9px' }}>
            <span style={{ color: '#948879', fontSize: '13px', letterSpacing: '2px', fontStyle: 'italic' }}>02 / Gender</span>
            <span style={{ color: '#221d18', fontSize: '14px', letterSpacing: '2px' }}>性别</span>
          </div>
          <SegmentedControl
            options={GENDERS}
            value={form.gender}
            onChange={(v) => onChange({ gender: v })}
          />
        </div>

        {/* Age */}
        <div style={{ marginBottom: '19px' }}>
          <div className="flex justify-between items-end" style={{ marginBottom: '9px' }}>
            <span style={{ color: '#948879', fontSize: '13px', letterSpacing: '2px', fontStyle: 'italic' }}>03 / Age</span>
            <span style={{ color: '#221d18', fontSize: '14px', letterSpacing: '2px' }}>开局年龄</span>
          </div>
          <SegmentedControl
            options={AGES}
            value={form.age}
            onChange={(v) => onChange({ age: v })}
          />
        </div>

        {/* Custom Note */}
        <div style={{ marginBottom: '19px' }}>
          <div className="flex justify-between items-end" style={{ marginBottom: '9px' }}>
            <span style={{ color: '#948879', fontSize: '13px', letterSpacing: '2px', fontStyle: 'italic' }}>04 / Note</span>
            <span style={{ color: '#221d18', fontSize: '14px', letterSpacing: '2px' }}>自定义设定</span>
          </div>
          <textarea
            value={form.customNote}
            onChange={(e) => onChange({ customNote: e.target.value })}
            placeholder="可写下角色秘密、前世记忆、家庭背景、恐惧、执念或禁忌。"
            style={{
              width: '100%',
              minHeight: '74px',
              resize: 'none',
              lineHeight: '1.7',
              border: 'none',
              borderBottom: '1px solid rgba(34,29,24,0.18)',
              background: 'transparent',
              color: '#221d18',
              outline: 'none',
              borderRadius: 0,
              fontFamily: "'Noto Serif SC', serif",
              fontSize: '14px',
              padding: '7px 0 13px',
              transition: '.32s ease',
            }}
            onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#7a2020'; e.currentTarget.style.paddingLeft = '8px'; }}
            onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(34,29,24,0.18)'; e.currentTarget.style.paddingLeft = '0'; }}
          />
        </div>

        {/* Attributes */}
        <div className="flex justify-between items-end" style={{ marginBottom: '11px' }}>
          <span style={{ color: '#221d18', fontSize: '16px', letterSpacing: '3px' }}>初始属性</span>
          <span style={{ color: '#948879', fontSize: '13px', letterSpacing: '2px', fontStyle: 'italic' }}>Base Attributes</span>
        </div>
        <div
          style={{
            borderTop: '1px solid rgba(34,29,24,0.13)',
            borderBottom: '1px solid rgba(34,29,24,0.13)',
            background: 'rgba(248,244,236,0.18)',
            padding: '4px 0 8px',
            overflow: 'hidden',
          }}
        >
          <div className="grid" style={{ gap: '5px' }}>
            {ATTR_CONFIG.map((attr) => {
              const value = form.attributes[attr.key] || attr.base;
              return (
                <div
                  key={attr.key}
                  className="grid"
                  style={{
                    gridTemplateColumns: '54px 1fr 74px',
                    gap: '8px',
                    alignItems: 'center',
                    border: 'none',
                    borderBottom: '1px solid rgba(34,29,24,0.09)',
                    background: 'transparent',
                    padding: '6px 0',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <b
                      style={{
                        display: 'block',
                        fontSize: '15px',
                        fontWeight: 400,
                        letterSpacing: '2px',
                        marginBottom: '3px',
                        lineHeight: 1,
                        color: '#221d18',
                      }}
                    >
                      {attr.name}
                    </b>
                    <span
                      style={{
                        display: 'block',
                        color: '#948879',
                        fontSize: '9px',
                        letterSpacing: '1.2px',
                        lineHeight: 1,
                      }}
                    >
                      {attr.en}
                    </span>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        height: '1px',
                        background: 'rgba(34,29,24,0.16)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: `${value * 10}%`,
                          height: '1px',
                          background: '#7a2020',
                        }}
                      />
                    </div>
                  </div>

                  <div
                    className="grid"
                    style={{ gridTemplateColumns: '22px 26px 22px', gap: '2px', alignItems: 'center', justifyContent: 'end' }}
                  >
                    <button
                      onClick={() => onAttrChange(attr.key, -1)}
                      style={{
                        width: '22px',
                        height: '24px',
                        border: '1px solid rgba(34,29,24,0.13)',
                        background: 'rgba(248,244,236,0.26)',
                        color: '#221d18',
                        fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
                        fontSize: '14px',
                        lineHeight: 1,
                        cursor: 'pointer',
                      }}
                    >
                      −
                    </button>
                    <div
                      style={{
                        textAlign: 'center',
                        color: '#221d18',
                        fontSize: '19px',
                        lineHeight: 1,
                        fontWeight: 300,
                      }}
                    >
                      {String(value).padStart(2, '0')}
                    </div>
                    <button
                      onClick={() => onAttrChange(attr.key, 1)}
                      style={{
                        width: '22px',
                        height: '24px',
                        border: '1px solid rgba(34,29,24,0.13)',
                        background: 'rgba(248,244,236,0.26)',
                        color: '#221d18',
                        fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
                        fontSize: '14px',
                        lineHeight: 1,
                        cursor: 'pointer',
                      }}
                    >
                      ＋
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)`, border: '1px solid rgba(34,29,24,0.13)' }}
    >
      {options.map((opt, i) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            border: 'none',
            borderRight: i < options.length - 1 ? '1px solid rgba(34,29,24,0.13)' : 'none',
            background: value === opt ? '#221d18' : 'transparent',
            color: value === opt ? '#f8f4ec' : '#948879',
            height: '48px',
            fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
            fontSize: '14px',
            letterSpacing: '3px',
            cursor: 'pointer',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}


