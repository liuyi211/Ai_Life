import { useCreation } from './useCreation';
import Sigil from '../dashboard/components/Sigil';
import StepProgress from './components/StepProgress';
import StepWorld from './components/StepWorld';
import StepIdentity from './components/StepIdentity';
import StepTalent from './components/StepTalent';
import StepLegacy from './components/StepLegacy';
import StepConfirm from './components/StepConfirm';
import Sheet from '../dashboard/components/Sheet';
import Toast from '../dashboard/components/Toast';

export default function CreationPage() {
  const {
    step,
    form,
    drawing,
    drawnTalents,
    sheetOpen,
    sheetTitle,
    sheetText,
    toastText,
    toastVisible,
    nextLabel,
    goStep,
    nextStep,
    prevStep,
    updateForm,
    updateAttribute,
    drawTalents,
    redrawTalents,
    toggleTalent,
    toggleLegacy,
    randomAll,
    handleCreate,
    openSheet,
    closeSheet,
  } = useCreation();

  const handleNext = () => {
    if (step === 4) {
      handleCreate();
    } else {
      nextStep();
    }
  };

  return (
    <div
      className="creation-page relative w-full h-screen flex flex-col overflow-hidden"
      style={{ padding: '22px 22px 18px', zIndex: 1 }}
    >
      <Sigil />

      {/* TopBar */}
      <header
        className="grid"
        style={{
          gridTemplateColumns: '44px 1fr 44px',
          alignItems: 'start',
          gap: '12px',
          marginBottom: '7px',
        }}
      >
        <button
          onClick={() =>
            openSheet('返回主厅', '当前新建人生尚未完成，返回后将丢失未保存的命运设定。')
          }
          className="grid place-items-center"
          style={{
            width: '44px',
            height: '44px',
            border: '1px solid rgba(34,29,24,0.28)',
            background: 'rgba(248,244,236,0.38)',
            color: '#221d18',
            fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
            fontSize: '20px',
            cursor: 'pointer',
            transition: '.24s ease',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(2px)';
            e.currentTarget.style.borderColor = '#7a2020';
            e.currentTarget.style.color = '#7a2020';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(34,29,24,0.28)';
            e.currentTarget.style.color = '#221d18';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(34,29,24,0.28)';
            e.currentTarget.style.color = '#221d18';
          }}
        >
          ‹
        </button>

        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              color: '#948879',
              fontSize: '11px',
              letterSpacing: '1.5px',
              fontStyle: 'italic',
              marginBottom: '4px',
            }}
          >
            Genesis Ritual
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: '28px',
              lineHeight: '1.08',
              fontWeight: 400,
              letterSpacing: '5px',
              color: '#221d18',
            }}
          >
            命运捏造
          </h1>
        </div>

        <button
          onClick={randomAll}
          className="grid place-items-center"
          style={{
            width: '44px',
            height: '44px',
            border: '1px solid rgba(34,29,24,0.28)',
            background: 'rgba(248,244,236,0.38)',
            color: '#221d18',
            fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
            fontSize: '20px',
            cursor: 'pointer',
            transition: '.24s ease',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(2px)';
            e.currentTarget.style.borderColor = '#7a2020';
            e.currentTarget.style.color = '#7a2020';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(34,29,24,0.28)';
            e.currentTarget.style.color = '#221d18';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(34,29,24,0.28)';
            e.currentTarget.style.color = '#221d18';
          }}
        >
          骰
        </button>
      </header>

      <StepProgress step={step} onStepClick={goStep} />

      <section
        className="flex-1 min-h-0 relative overflow-hidden"
        style={{ marginTop: '8px' }}
      >
        {step === 0 && (
          <StepWorld form={form} onChange={updateForm} />
        )}
        {step === 1 && (
          <StepIdentity
            form={form}
            onChange={updateForm}
            onAttrChange={updateAttribute}
          />
        )}
        {step === 2 && (
          <StepTalent
            drawnTalents={drawnTalents}
            selectedTalents={form.talents}
            drawing={drawing}
            onDraw={drawTalents}
            onRedraw={redrawTalents}
            onToggle={toggleTalent}
          />
        )}
        {step === 3 && (
          <StepLegacy
            selected={form.legacy}
            onToggle={toggleLegacy}
          />
        )}
        {step === 4 && <StepConfirm form={form} />}
      </section>

      <footer
        className="grid"
        style={{
          gridTemplateColumns: '78px 1fr',
          gap: '10px',
          marginTop: '12px',
        }}
      >
        <button
          onClick={prevStep}
          style={{
            height: '56px',
            border: '1px solid rgba(34,29,24,0.28)',
            background: 'rgba(248,244,236,0.32)',
            color: '#948879',
            fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
            fontSize: '15px',
            letterSpacing: '4px',
            cursor: 'pointer',
            transition: '.24s ease',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.color = '#7a2020';
            e.currentTarget.style.borderColor = '#7a2020';
            e.currentTarget.style.transform = 'translateY(2px)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.color = '#948879';
            e.currentTarget.style.borderColor = 'rgba(34,29,24,0.28)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#948879';
            e.currentTarget.style.borderColor = 'rgba(34,29,24,0.28)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          返回
        </button>

        <button
          onClick={handleNext}
          style={{
            height: '56px',
            border: 'none',
            background: '#221d18',
            color: '#f8f4ec',
            fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
            fontSize: '15px',
            letterSpacing: '4px',
            cursor: 'pointer',
            transition: '.24s ease',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.background = '#7a2020';
            e.currentTarget.style.transform = 'translateY(2px)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.background = '#221d18';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#221d18';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {nextLabel}
        </button>
      </footer>

      <Sheet
        isOpen={sheetOpen}
        title={sheetTitle}
        text={sheetText}
        onClose={closeSheet}
        onEnter={() => {
          closeSheet();
          if (step === 0) prevStep();
        }}
      />

      <Toast text={toastText} visible={toastVisible} />

      <style>{`
        .creation-page { background: var(--bg, #eee9df); }
        @media (max-width: 380px) {
          .creation-page { padding-left: 16px !important; padding-right: 16px !important; }
        }
        @media (min-width: 768px) {
          body { display: flex !important; align-items: center !important; justify-content: center !important; background: #d4c8b8 !important; }
          .creation-page { width: 430px !important; height: 860px !important; max-height: 96vh !important; background: #eee9df !important; box-shadow: 0 30px 100px rgba(34,29,24,0.24) !important; }
        }
      `}</style>
    </div>
  );
}
