import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveApi } from '../../services/api';
import { clearLocalBackup } from '../../services/storage';
import type { CreationForm, LegacyItem } from './data';
import {
  DEFAULT_FORM,
  STEP_META,
  TALENT_POOLS,
  WORLDS,
} from './data';

export function useCreation() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreationForm>({ ...DEFAULT_FORM });
  const [drawing, setDrawing] = useState(false);
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
      setForm((prev) => ({ ...prev, ...updates }));
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

  const drawTalents = useCallback(() => {
    if (form.talents.length > 0) return;
    setDrawing(true);
    setTimeout(() => {
      const poolIndex = Math.floor(Math.random() * TALENT_POOLS.length);
      const pool = TALENT_POOLS[poolIndex];
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      updateForm({ talents: shuffled.slice(0, 3) });
      setDrawing(false);
      showToast('命运已回应');
    }, 1200);
  }, [form.talents.length, updateForm, showToast]);

  const toggleLegacy = useCallback(
    (item: LegacyItem) => {
      setForm((prev) => {
        const exists = prev.legacy.find((l) => l.name === item.name);
        if (exists) {
          return { ...prev, legacy: prev.legacy.filter((l) => l.name !== item.name) };
        }
        if (prev.legacy.length >= 3) {
          showToast('最多继承三项遗产');
          return prev;
        }
        return { ...prev, legacy: [...prev.legacy, item] };
      });
    },
    [showToast]
  );

  const randomAll = useCallback(() => {
    const randomWorld = Math.floor(Math.random() * 6);
    const randomGender = Math.floor(Math.random() * 3);
    const randomAge = Math.floor(Math.random() * 3);
    const randomPersonality = Math.floor(Math.random() * 6);
    const randomDesire = Math.floor(Math.random() * 6);
    const poolIndex = Math.floor(Math.random() * TALENT_POOLS.length);
    const pool = TALENT_POOLS[poolIndex];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    setForm({
      ...DEFAULT_FORM,
      world: ['earth', 'cultivation', 'martial', 'cyber', 'doomsday', 'myth'][randomWorld],
      gender: ['男', '女', '未知'][randomGender],
      age: ['幼年', '少年', '成年'][randomAge],
      personality: ['冷静克制', '野心强烈', '温柔敏感', '叛逆孤勇', '功利现实', '理想主义'][randomPersonality],
      desire: ['改变命运', '守护家人', '获得力量', '追求真相', '积累财富', '摆脱控制'][randomDesire],
      talents: shuffled.slice(0, 3),
      attributes: {
        body: Math.floor(Math.random() * 6) + 3,
        mind: Math.floor(Math.random() * 6) + 3,
        charm: Math.floor(Math.random() * 6) + 3,
        fate: Math.floor(Math.random() * 6) + 3,
      },
    });
    showToast('命运已掷骰');
  }, [showToast]);

  const handleCreate = useCallback(async () => {
    try {
      const worldConfig = WORLDS.find((w) => w.id === form.world);
      const characterData = {
        name: form.name || '无名者',
        world: worldConfig?.name || '地球 Online',
        worldConfig: form.worldConfig,
        gender: form.gender,
        age: form.age,
        personality: form.personality,
        desire: form.desire,
        customNote: form.customNote,
        attributes: form.attributes,
        talents: form.talents,
        legacy: form.legacy,
        lifeStage: '幼年',
        isAlive: true,
      };

      const res = await saveApi.create({
        character: characterData,
        history: [],
        achievements: [],
        playTime: 0,
        generation: 1,
      });

      const saveId = res.data.save.id;
      // 创建新角色时清除旧的本地备份，避免旧存档干扰
      clearLocalBackup();
      showToast('命线已铭刻');
      setTimeout(() => navigate(`/game?saveId=${saveId}`), 800);
    } catch (err: any) {
      showToast(err.response?.data?.message || '铭刻失败，请重试');
    }
  }, [form, showToast, navigate]);

  const stepMeta = STEP_META[step];
  const nextLabel = ['确认世界', '确认身份', '确认天赋', '确认继承', '铭刻命线'][step];

  return {
    step,
    form,
    drawing,
    sheetOpen,
    sheetTitle,
    sheetText,
    toastText,
    toastVisible,
    stepMeta,
    nextLabel,
    goStep,
    nextStep,
    prevStep,
    updateForm,
    updateAttribute,
    drawTalents,
    toggleLegacy,
    randomAll,
    handleCreate,
    openSheet,
    closeSheet,
    showToast,
  };
}
