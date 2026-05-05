import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveApi } from '../../services/api';
import { clearLocalBackup } from '../../services/storage';
import { useWorldStore } from '../../stores/worldStore';
import type { CreationForm, LegacyItem, Talent } from './data';
import { DEFAULT_FORM } from './data';

export function useCreation() {
  const navigate = useNavigate();
  const allWorlds = useWorldStore((state) => state.allWorlds);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreationForm>({ ...DEFAULT_FORM });
  const [drawing, setDrawing] = useState(false);
  const [drawnTalents, setDrawnTalents] = useState<Talent[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTitle, setSheetTitle] = useState('');
  const [sheetText, setSheetText] = useState('');
  const [toastText, setToastText] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useState<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (text: string) => {
      setToastText(text);
      setToastVisible(true);
      if (toastTimer[0]) clearTimeout(toastTimer[0]);
      const timer = setTimeout(() => setToastVisible(false), 1400);
      toastTimer[1](timer);
    },
    [toastTimer]
  );

  const openSheet = useCallback((title: string, text: string) => {
    setSheetTitle(title);
    setSheetText(text);
    setSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const goStep = useCallback(
    (s: number) => {
      if (s >= 0 && s <= 4) {
        setStep(s);
      }
    },
    []
  );

  const nextStep = useCallback(() => {
    if (step < 4) setStep(step + 1);
  }, [step]);

  const prevStep = useCallback(() => {
    if (step > 0) setStep(step - 1);
    else navigate('/');
  }, [step, navigate]);

  const updateForm = useCallback(
    (updates: Partial<CreationForm>) => {
      const shouldResetTalents = 'world' in updates;
      if (shouldResetTalents) {
        setDrawnTalents([]);
      }
      setForm((prev) => ({
        ...prev,
        ...updates,
        talents: shouldResetTalents ? [] : prev.talents,
      }));
    },
    []
  );

  const updateAttribute = useCallback(
    (key: string, delta: number) => {
      setForm((prev) => {
        const current = prev.attributes[key] || 0;
        const next = Math.max(1, Math.min(10, current + delta));
        return {
          ...prev,
          attributes: { ...prev.attributes, [key]: next },
        };
      });
    },
    []
  );

  const performDraw = useCallback(() => {
    const world = allWorlds.find((w) => w.id === form.world);
    const pool = world?.talentPool || [];
    if (pool.length === 0) {
      setDrawing(false);
      showToast('当前世界暂无天赋池');
      return;
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const drawn = shuffled.slice(0, Math.min(3, pool.length));
    setDrawnTalents(drawn);
    setDrawing(false);
  }, [form.world, allWorlds, showToast]);

  const drawTalents = useCallback(() => {
    if (drawnTalents.length > 0) return;
    setDrawing(true);
    setTimeout(() => {
      performDraw();
      showToast('命运池已开启');
    }, 1200);
  }, [drawnTalents, performDraw, showToast]);

  const redrawTalents = useCallback(() => {
    const selected = form.talents;
    if (selected.length >= 3) {
      showToast('已选满三项天赋');
      return;
    }
    setDrawing(true);
    setTimeout(() => {
      const world = allWorlds.find((w) => w.id === form.world);
      const pool = world?.talentPool || [];
      if (pool.length === 0) {
        setDrawing(false);
        showToast('当前世界暂无天赋池');
        return;
      }
      // 排除已选中的天赋，避免重复
      const selectedNames = new Set(selected.map((t) => t.name));
      const remaining = pool.filter((t) => !selectedNames.has(t.name));
      const needCount = 3 - selected.length;
      const shuffled = [...remaining].sort(() => Math.random() - 0.5);
      const newDrawn = shuffled.slice(0, Math.min(needCount, remaining.length));
      // 已选中的保留，未选中的替换为新抽的
      setDrawnTalents([...selected, ...newDrawn]);
      setDrawing(false);
      showToast('命运已重掷');
    }, 1200);
  }, [form.talents, form.world, allWorlds, showToast]);

  const toggleTalent = useCallback(
    (talent: Talent) => {
      setForm((prev) => {
        const exists = prev.talents.find((t) => t.name === talent.name);
        if (exists) {
          return { ...prev, talents: prev.talents.filter((t) => t.name !== talent.name) };
        }
        if (prev.talents.length >= 3) {
          showToast('最多选择三项天赋');
          return prev;
        }
        return { ...prev, talents: [...prev.talents, talent] };
      });
    },
    [showToast]
  );

  const toggleLegacy = useCallback(
    (item: LegacyItem) => {
      setForm((prev) => {
        const exists = prev.legacy.find((l) => l.name === item.name);
        if (exists) {
          return { ...prev, legacy: prev.legacy.filter((l) => l.name !== item.name) };
        }
        if (prev.legacy.length >= 2) {
          showToast('最多继承两项遗产');
          return prev;
        }
        return { ...prev, legacy: [...prev.legacy, item] };
      });
    },
    [showToast]
  );

  const randomAll = useCallback(() => {
    const worldIds = allWorlds.map((w) => w.id);
    const randomWorld = Math.floor(Math.random() * worldIds.length);
    const randomGender = Math.floor(Math.random() * 3);
    const randomAge = Math.floor(Math.random() * 3);

    const selectedWorldId = worldIds[randomWorld] || 'earth';
    const world = allWorlds.find((w) => w.id === selectedWorldId);
    const pool = world?.talentPool || [];

    let drawn: Talent[] = [];
    let randomTalents: Talent[] = [];
    if (pool.length > 0) {
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      drawn = shuffled.slice(0, Math.min(3, pool.length));
      // 随机选择1-3个
      const selectCount = Math.min(drawn.length, Math.floor(Math.random() * 3) + 1);
      randomTalents = drawn.slice(0, selectCount);
    }

    setForm({
      ...DEFAULT_FORM,
      world: selectedWorldId,
      worldConfig: world?.configOptions?.[0] || '现代',
      gender: ['男', '女', '未知'][randomGender],
      age: ['幼年', '少年', '成年'][randomAge],
      talents: randomTalents,
      attributes: {
        body: Math.floor(Math.random() * 6) + 3,
        mind: Math.floor(Math.random() * 6) + 3,
        charm: Math.floor(Math.random() * 6) + 3,
        fate: Math.floor(Math.random() * 6) + 3,
      },
    });
    setDrawnTalents(drawn);
    showToast('命运已掷骰');
  }, [showToast, allWorlds]);

  const handleCreate = useCallback(async () => {
    try {
      // 检查是否有轮回继承数据
      const inheritDataStr = localStorage.getItem('reincarnation_inherit');
      let inheritData: any = null;
      let finalAttributes = { ...form.attributes };
      let finalGeneration = 1;
      let finalLegacy = [...form.legacy];

      if (inheritDataStr) {
        try {
          inheritData = JSON.parse(inheritDataStr);
          // 应用基因继承
          if (inheritData.genes) {
            inheritData.genes.forEach((g: any) => {
              if (finalAttributes[g.attr] !== undefined) {
                finalAttributes[g.attr] = Math.min(10, finalAttributes[g.attr] + g.value);
              }
            });
          }
          // 应用遗产继承
          if (inheritData.legacy && inheritData.legacy.length > 0) {
            finalLegacy = [...finalLegacy, ...inheritData.legacy].slice(0, 3);
          }
          finalGeneration = inheritData.generation || 1;
        } catch {
          // 忽略解析错误
        }
      }

      const worldConfig = allWorlds.find((w) => w.id === form.world);
      const characterData = {
        name: form.name || '无名者',
        world: worldConfig?.name || '地球 Online',
        worldConfig: form.worldConfig,
        gender: form.gender,
        age: form.age,
        customNote: form.customNote,
        attributes: finalAttributes,
        talents: form.talents,
        legacy: finalLegacy,
        lifeStage: '幼年',
        isAlive: true,
      };

      const res = await saveApi.create({
        character: characterData,
        history: [],
        achievements: [],
        playTime: 0,
        generation: finalGeneration,
      });

      const saveId = res.data.save.id;
      // 创建新角色时清除旧的本地备份，避免旧存档干扰
      clearLocalBackup();
      // 清除轮回继承数据
      localStorage.removeItem('reincarnation_inherit');
      showToast(finalGeneration > 1 ? '轮回已启' : '命线已铭刻');
      setTimeout(() => navigate(`/game?saveId=${saveId}`), 800);
    } catch (err: any) {
      showToast(err.response?.data?.message || '铭刻失败，请重试');
    }
  }, [form, showToast, navigate, allWorlds]);

  const nextLabel = ['确认世界', '确认身份', '确认天赋', '确认继承', '铭刻命线'][step];

  return {
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
    showToast,
  };
}
