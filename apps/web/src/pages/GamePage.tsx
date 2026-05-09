import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { saveApi, aiApi } from '../services/api';
import {
  saveLocalBackup,
  loadLocalBackup,
} from '../services/storage';
import type { GameState, GameEvent } from '../engine/gameEngine';
import {
  createGameStateFromSave,
  applyChoiceEffects,
  addHistoryEntry,
  calculateDerivedStats,
  getLifeStage,
  serializeGameState,
  applyLifeStatusChanges,
  createDefaultLifeStatus,
  type AttributeEffects,
} from '../engine/gameEngine';
import {
  getWorldDeathConfig,
  getRandomAccident,
  getTransitionText,
  getStageTransitionText,
} from '../engine/worldConfig';

// ==================== Toast Hook ====================
function useToast() {
  const [text, setText] = useState('');
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string) => {
    setText(msg);
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 1400);
  }, []);

  return { text, visible, show };
}

// ==================== 属性变化动画 Hook ====================
function useStatBump() {
  const [bumps, setBumps] = useState<Record<string, boolean>>({});
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const trigger = useCallback((key: string) => {
    setBumps((prev) => ({ ...prev, [key]: true }));
    if (timersRef.current[key]) clearTimeout(timersRef.current[key]);
    timersRef.current[key] = setTimeout(() => {
      setBumps((prev) => ({ ...prev, [key]: false }));
    }, 1200);
  }, []);

  return { bumps, trigger };
}

// ==================== 常量 ====================
const ATTR_LABELS = [
  { key: 'body', label: '体魄' },
  { key: 'mind', label: '悟性' },
  { key: 'charm', label: '羁绊' },
  { key: 'fate', label: '气运' },
];

const CHOICE_KEYS = ['A', 'B', 'C'] as const;
const CHOICE_EFFECT_LABELS: Record<string, string> = {
  body: '体魄',
  mind: '悟性',
  charm: '羁绊',
  fate: '气运',
};

const EFFECT_MAP: Record<string, keyof AttributeEffects> = {
  '体魄': 'body',
  '悟性': 'mind',
  '羁绊': 'charm',
  '气运': 'fate',
  'body': 'body',
  'mind': 'mind',
  'charm': 'charm',
  'fate': 'fate',
};

// ==================== 主组件 ====================
export default function GamePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [saveId, setSaveId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [choiceMode, setChoiceMode] = useState(false);
  const [storyEntries, setStoryEntries] = useState<Array<{ text: string; type: 'narrative' | 'choice' | 'system' | 'result' | 'error' }>>([]);
  const [currentFragment, setCurrentFragment] = useState(1);

  // 抉择计数器：每 5-8 个节点触发一次抉择（代码控制，忽略 AI 的建议）
  const choiceCounterRef = useRef<number>(Math.floor(Math.random() * 4) + 5); // 5-8 随机初始值
  const [storyState, setStoryState] = useState('命运正在展开');
  const [typedEntries, setTypedEntries] = useState<Set<number>>(new Set());
  const [displayTexts, setDisplayTexts] = useState<Record<number, string>>({});
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiChecked, setAiChecked] = useState(false);

  const toast = useToast();
  const statBump = useStatBump();
  const storyScrollRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<{ index: number; timer: ReturnType<typeof setInterval> | null }>({ index: -1, timer: null });
  const hasInitializedRef = useRef(false);
  const gameStateRef = useRef<GameState | null>(null);
  const transitionsUntilNext = useRef<number>(Math.floor(Math.random() * 3) + 3); // 每3-5个叙事插一个过渡

  // 同步 gameState 到 ref，确保 cleanup/unload 时读取最新状态
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // 打字机效果
  const typeText = useCallback((entryIndex: number, text: string, onComplete?: () => void) => {
    if (typingRef.current.timer) clearInterval(typingRef.current.timer);

    typingRef.current.index = entryIndex;
    let i = 0;

    typingRef.current.timer = setInterval(() => {
      i++;
      setDisplayTexts((prev) => ({ ...prev, [entryIndex]: text.slice(0, i) }));

      if (storyScrollRef.current) {
        storyScrollRef.current.scrollTop = storyScrollRef.current.scrollHeight;
      }

      if (i >= text.length) {
        if (typingRef.current.timer) clearInterval(typingRef.current.timer);
        typingRef.current.timer = null;
        typingRef.current.index = -1;
        setTypedEntries((prev) => {
          const next = new Set(prev);
          next.add(entryIndex);
          return next;
        });
        onComplete?.();
      }
    }, 28);
  }, []);

  // 添加故事条目并触发打字（skipTyping=true 时直接显示全文）
  const appendStoryEntry = useCallback((
    text: string,
    type: 'narrative' | 'choice' | 'system' | 'result' | 'error' = 'narrative',
    onComplete?: () => void,
    skipTyping?: boolean,
  ) => {
    setStoryEntries((prev) => {
      const newIndex = prev.length;
      const next = [...prev, { text, type }];
      if (skipTyping) {
        // 直接标记为已完整显示，跳过打字动画
        setTypedEntries((prevTyped) => {
          const nextTyped = new Set(prevTyped);
          nextTyped.add(newIndex);
          return nextTyped;
        });
        onComplete?.();
      } else {
        requestAnimationFrame(() => {
          typeText(newIndex, text, onComplete);
        });
      }
      return next;
    });
  }, [typeText]);

  // 保存游戏状态（后端 + 本地双写）
  const saveGameState = useCallback(async (state: GameState, currentSaveId: string | null) => {
    if (!currentSaveId) return;
    try {
      const serialized = serializeGameState(state);
      // 同时保存到后端和本地，确保任一通道成功都能恢复
      await saveApi.update(currentSaveId, serialized);
      saveLocalBackup(state, currentSaveId);
    } catch {
      // 后端保存失败时，至少保存到本地
      saveLocalBackup(state, currentSaveId);
    }
  }, []);

  // 加载存档 + 检查AI配置
  useEffect(() => {
    // 防止 React StrictMode 下重复执行
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const loadSave = async () => {
      try {
        // 1. 从后端加载存档（获取 saveId 和元数据）
        const urlSaveId = searchParams.get('saveId');
        let backendSave: any = null;
        let currentSaveId: string;

        if (urlSaveId) {
          const res = await saveApi.getById(urlSaveId);
          backendSave = res.data.save;
          currentSaveId = urlSaveId;
        } else {
          const res = await saveApi.getActive();
          backendSave = res.data.save;
          currentSaveId = backendSave.id;
        }
        setSaveId(currentSaveId);

        // 2. 检查本地备份
        const localBackup = loadLocalBackup();

        // 3. 选择数据源：优先使用更新的存档
        let saveData = backendSave;
        if (localBackup && localBackup.saveId === currentSaveId) {
          const backendTime = backendSave?.updatedAt
            ? new Date(backendSave.updatedAt).getTime()
            : 0;
          const localTime = localBackup.timestamp;
          if (localTime > backendTime) {
            saveData = localBackup.state;
          }
        }

        // 4. 创建游戏状态
        const state = createGameStateFromSave(saveData);
        setGameState(state);

        // 检查AI配置
        try {
          const configRes = await aiApi.getConfig();
          const hasAi = configRes.data.config?.hasApiKey || false;
          setAiEnabled(hasAi);
          setAiChecked(true);

          // 判断是否是继续游戏：history 有内容说明已经玩过
          const isContinuing = state.history.length > 0;

          if (isContinuing) {
            // 继续游戏：恢复历史记录到 storyEntries
            const entries: typeof storyEntries = [];
            state.history.forEach((h) => {
              entries.push({ text: h.narrative, type: 'narrative' });
              if (h.choice) {
                // 构建属性变化展示
                const effectParts: string[] = [];
                if (h.effects) {
                  (Object.keys(h.effects) as Array<keyof AttributeEffects>).forEach((key) => {
                    const val = h.effects[key];
                    if (val && val !== 0) {
                      const label = CHOICE_EFFECT_LABELS[key] || key;
                      effectParts.push(`${label}${val > 0 ? '+' : ''}${val}`);
                    }
                  });
                }
                const effectStr = effectParts.length > 0 ? `  · ${effectParts.join('，')}` : '';
                entries.push({ text: `选择了：${h.choice}${effectStr}`, type: 'choice' });
              }
            });
            // 如果有 currentEvent，说明之前触发了事件还没选择
            if (state.currentEvent) {
              entries.push({ text: state.currentEvent.narrative, type: 'narrative' });
              setChoiceMode(true);
              setStoryState('命运出现分歧');
            }
            setStoryEntries(entries);
            // 标记所有历史条目为已打字完成
            setTypedEntries(new Set(Array.from({ length: entries.length }, (_, i) => i)));
          } else if (hasAi) {
            // 新游戏：调用AI生成初始人生节点（出生）
            setStoryState('AI 正在演算');
            setGenerating(true);
            try {
              const bgRes = await aiApi.generateBackground({
                character: {
                  name: state.character.name,
                  world: state.character.world,
                  gender: state.character.gender,
                  personality: state.character.personality,
                  desire: state.character.desire,
                  attributes: state.character.attributes,
                  talents: state.character.talents,
                  legacy: state.character.legacy,
                },
              });
              if (bgRes.data.success && bgRes.data.node) {
                const node = bgRes.data.node;
                // 更新角色年龄
                const newCharacter = { ...state.character, age: node.newAge || 0 };
                // 应用状态变化
                const newLifeStatus = applyLifeStatusChanges(
                  state.lifeStatus || createDefaultLifeStatus(),
                  node.statusChanges
                );
                // 初始节点不触发选择（由计数器在后续节点控制抉择频率）
                const baseState: GameState = {
                  ...state,
                  character: newCharacter,
                  lifeStatus: newLifeStatus,
                };
                appendStoryEntry(node.text, 'narrative');
                setGameState(baseState);

                // 直接添加到历史记录（初始节点永不触发选择）
                const newState = addHistoryEntry(
                  baseState,
                  node.text,
                  '',
                  {},
                  {
                    yearsPassed: node.yearsPassed || 0,
                    eventType: node.eventType,
                    consequences: node.consequences,
                    statusChanges: node.statusChanges,
                    isDeath: node.isDeath,
                    deathText: node.deathText,
                  }
                );
                setGameState(newState);
                await saveGameState(newState, currentSaveId);

                // 检查死亡
                if (node.isDeath) {
                  const finalState = {
                    ...newState,
                    character: { ...newState.character, isAlive: false },
                    gameStatus: 'dead' as const,
                  };
                  setGameState(finalState);
                  await saveGameState(finalState, currentSaveId);
                  if (node.deathText) {
                    appendStoryEntry(node.deathText, 'system');
                  }
                }
              } else {
                appendStoryEntry('命运尚未开口。', 'system');
              }
            } catch (err: any) {
              if (err.response?.status === 404) {
                appendStoryEntry('AI 服务尚未就绪，请重启后端服务器。', 'error');
              } else {
                appendStoryEntry('AI 暂时沉默，请检查 API Key 配置。', 'error');
              }
            } finally {
              setGenerating(false);
              setStoryState('命运正在展开');
            }
          } else {
            // 没有API Key
            appendStoryEntry('请在个人资料中配置 AI API Key，以开启命运模拟。', 'error');
          }
        } catch {
          appendStoryEntry('无法连接 AI 服务，请检查网络或重启后端。', 'error');
          setAiChecked(true);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          toast.show('无存档，请先创建角色');
          setTimeout(() => navigate('/'), 1500);
        } else {
          toast.show('加载存档失败');
        }
      } finally {
        setLoading(false);
      }
    };
    loadSave();
  }, [navigate, toast.show, appendStoryEntry]);

  // 游戏时长计时器
  useEffect(() => {
    if (!gameState || gameState.gameStatus !== 'playing') return;
    const interval = setInterval(() => {
      setGameState((prev) => {
        if (!prev) return prev;
        return { ...prev, playTime: prev.playTime + 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState?.gameStatus]);

  // 页面关闭/刷新前强制保存到本地；组件卸载时自动保存（使用 ref 避免闭包旧值）
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentState = gameStateRef.current;
      const currentSaveId = saveId;
      if (currentState && currentSaveId) {
        saveLocalBackup(currentState, currentSaveId);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // 组件卸载时：如果最新状态仍是 playing 才自动保存，避免覆盖死亡/结算状态
      const currentState = gameStateRef.current;
      if (currentState && currentState.gameStatus === 'playing' && saveId) {
        saveGameState(currentState, saveId);
      }
    };
  }, [saveGameState, saveId]);

  // 自动滚动到底部
  useEffect(() => {
    if (storyScrollRef.current) {
      storyScrollRef.current.scrollTop = storyScrollRef.current.scrollHeight;
    }
  }, [storyEntries, typedEntries]);

  // 拨动命线
  const handleContinueLife = useCallback(async () => {
    if (!gameState || gameState.gameStatus !== 'playing' || generating || choiceMode || !aiEnabled) return;

    setGenerating(true);
    setStoryState('AI 正在演算');

    try {
      // 0. 检查是否该插入过渡节点（每 3-5 个叙事节点插入一次）
      if (transitionsUntilNext.current <= 0) {
        transitionsUntilNext.current = Math.floor(Math.random() * 3) + 3; // 重置计数器
        const transitionText = getStageTransitionText(gameState.character.lifeStage);
        const narrative = transitionText; // 不标年龄

        const baseState: GameState = { ...gameState };
        const newState = addHistoryEntry(baseState, narrative, '', {}, {
          yearsPassed: 0, eventType: 'transition', consequences: [], isDeath: false,
        });

        setGameState(newState);
        appendStoryEntry(narrative, 'system', undefined, true);
        await saveGameState(newState, saveId);
        setGenerating(false);
        setStoryState('命运正在展开');
        return;
      }

      // 1. 调用AI生成结构化人生节点
      let node: any = null;
      try {
        const res = await aiApi.generateNarrative({
          character: {
            name: gameState.character.name,
            world: gameState.character.world,
            worldConfig: gameState.character.worldConfig,
            gender: gameState.character.gender,
            age: gameState.character.age,
            personality: gameState.character.personality,
            desire: gameState.character.desire,
            attributes: gameState.character.attributes,
            talents: gameState.character.talents,
            legacy: gameState.character.legacy,
            customNote: gameState.character.customNote || '',
          },
          lifeStatus: gameState.lifeStatus,
          history: gameState.history,
          stage: gameState.character.lifeStage,
        });
        if (res.data.success && res.data.node) {
          node = res.data.node;
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          appendStoryEntry('AI 服务尚未就绪，请重启后端服务器。', 'error');
        } else {
          appendStoryEntry('AI 暂时沉默，请检查 API Key 配置。', 'error');
        }
        setGenerating(false);
        setStoryState('命运正在展开');
        return;
      }

      if (!node) {
        appendStoryEntry('命运在此处留白。', 'system');
        setGenerating(false);
        setStoryState('命运正在展开');
        return;
      }

      // 2. 更新角色年龄
      const newAge = node.newAge || (gameState.character.age + (node.yearsPassed || 1));
      const newStage = getLifeStage(newAge);
      const newCharacter = {
        ...gameState.character,
        age: newAge,
        lifeStage: newStage,
      };

      // 3. 应用状态变化
      const newLifeStatus = applyLifeStatusChanges(
        gameState.lifeStatus,
        node.statusChanges
      );

      // 4. 检查死亡（世界特定判定 + 意外死亡 + AI 叙事内死亡）
      const worldCfg = getWorldDeathConfig(newCharacter.world);
      const derived = calculateDerivedStats(newCharacter);

      // 4a. 机械死亡：寿元耗尽 或 体魄衰竭
      const ageDeath = newAge >= derived.lifespan;
      const bodyDeath = newCharacter.attributes.body <= 0;
      // 4b. 终焉阶段概率死亡（按世界寿命比例调整阈值）
      const elderThreshold = Math.max(40, Math.round(derived.lifespan * 0.5));
      const elderDeath = newStage === 'elder' && newAge > elderThreshold
        && Math.random() < (newAge - elderThreshold) / (derived.lifespan - elderThreshold) * 0.3;
      // 4c. 意外死亡（按阶段加权：幼年极低，终焉增高）
      const stageRisk: Record<string, number> = {
        infant: 0.1, child: 0.3, youth: 0.6, adult: 1.0, elder: 1.5,
      };
      const accidentDeath = !ageDeath
        && Math.random() < worldCfg.accidentChance * (stageRisk[newStage] || 1.0);

      // 确定死因
      let deathCause = '';
      let deathNarrative = '';
      if (ageDeath) {
        deathCause = '寿元耗尽';
        const deathAge = Math.min(newAge, derived.lifespan);
        deathNarrative = `${deathAge}岁 — ${newCharacter.name}走到了生命尽头。大限已至，在${newCharacter.world}的故事至此终结。`;
        newCharacter.age = deathAge;
        newCharacter.lifeStage = getLifeStage(deathAge);
      } else if (bodyDeath) {
        deathCause = '体魄衰竭';
        deathNarrative = `${newAge}岁 — ${newCharacter.name}的身躯再也撑不住沉重的灵魂，在${newCharacter.world}的旅程戛然而止。`;
      } else if (accidentDeath) {
        deathCause = getRandomAccident(newCharacter.world);
        deathNarrative = `${newAge}岁 — 命运无常。${newCharacter.name}因${deathCause}，在${newCharacter.world}的故事骤然中断。`;
      } else if (elderDeath) {
        deathCause = '衰老';
        deathNarrative = `${newAge}岁 — 岁月磨灭了一切生机，${newCharacter.name}在${newCharacter.world}安详地闭上了双眼。`;
      }

      if (deathCause) {
        // 调用 AI 生成自然死亡场景叙事
        let aiDeathNarrative = deathNarrative;
        try {
          const deathRes = await aiApi.generateDeathNarrative({
            character: {
              name: newCharacter.name,
              age: newCharacter.age,
              personality: newCharacter.personality,
              desire: newCharacter.desire,
              lifeStage: newCharacter.lifeStage,
              world: newCharacter.world,
              attributes: newCharacter.attributes,
              talents: newCharacter.talents,
            },
            history: gameState.history,
            deathCause,
            world: newCharacter.world,
          });
          if (deathRes.data.success && deathRes.data.text) {
            aiDeathNarrative = deathRes.data.text;
          }
        } catch { /* 用硬编码兜底 */ }

        const finalState = addHistoryEntry(
          { ...gameState, character: newCharacter, lifeStatus: newLifeStatus },
          aiDeathNarrative,
          '',
          {},
          {
            yearsPassed: newAge - gameState.character.age,
            eventType: 'death',
            consequences: ['人生落幕'],
            statusChanges: node.statusChanges,
            isDeath: true,
            deathText: `最终年龄：${newCharacter.age}岁 · 死因：${deathCause}`,
          }
        );
        const deadState = {
          ...finalState,
          character: { ...finalState.character, isAlive: false },
          gameStatus: 'dead' as const,
        };
        setGameState(deadState);
        await saveGameState(deadState, saveId);
        setGenerating(false);
        setStoryState('命运已终结');
        appendStoryEntry(aiDeathNarrative, 'system');
        setTimeout(() => {
          appendStoryEntry(`最终年龄：${newCharacter.age}岁 · 死因：${deathCause}`, 'result', undefined, true);
        }, 600);
        toast.show(`${newCharacter.name} 已离世`);
        return;
      }

      // 5. 创建基础状态（不添加历史记录；如果触发选择，由 handleChoice 统一添加）
      const baseState: GameState = {
        ...gameState,
        character: newCharacter,
        lifeStatus: newLifeStatus,
      };

      // 6. 显示年龄过渡文本 + 叙事文本
      if (gameState.history.length > 0) {
        const yearsPassed = newAge - gameState.character.age;
        if (yearsPassed > 0) {
          const transition = getTransitionText(newCharacter.world, yearsPassed);
          const transitionText = yearsPassed > 3
            ? `${transition}${yearsPassed}年过去了——`
            : `${transition}`;
          appendStoryEntry(transitionText, 'system');
        }
      }
      appendStoryEntry(node.text, 'narrative');

      // 7. 代码控制抉择频率：每 5-8 个节点触发一次（忽略 AI 建议）
      let stateToSave: GameState = baseState;
      let shouldDeferHistory = false;
      setGameState(baseState);
      setCurrentFragment((prev) => prev + 1);
      setStoryState('命运正在展开');

      // 递减计数器，<=0 时触发抉择
      choiceCounterRef.current--;
      const shouldTriggerChoice = choiceCounterRef.current <= 0;

      if (shouldTriggerChoice) {
        shouldDeferHistory = true;
        try {
          const choiceRes = await aiApi.generateChoices({
            character: newCharacter,
            lifeStatus: newLifeStatus,
            node,
            count: 3,
          });
          if (choiceRes.data.success && choiceRes.data.choices?.length > 0) {
            const choices = choiceRes.data.choices.map((c: any, i: number) => {
              const effectKey = EFFECT_MAP[c.effect] || 'fate';
              return {
                id: `choice_${newAge}_${i}`,
                text: c.text,
                effects: { [effectKey]: c.value || 1 } as AttributeEffects,
              };
            });
            const event: GameEvent = {
              id: `event_${newAge}_${Date.now()}`,
              year: newAge,
              stage: newStage,
              title: node.summary || '命运的抉择',
              narrative: node.text,
              choices,
              type: 'choice',
              yearsPassed: node.yearsPassed,
              eventType: node.eventType,
              consequences: node.consequences,
              statusChanges: node.statusChanges,
            };
            stateToSave = { ...baseState, currentEvent: event };
            setGameState(stateToSave);
            setTimeout(() => {
              setChoiceMode(true);
              setStoryState('命运出现分歧');
            }, 400);
          }
        } catch {
          // AI选择生成失败，静默处理
        }
      }

      // 如果没有触发选择，立即添加到历史记录
      if (!shouldDeferHistory) {
        stateToSave = addHistoryEntry(
          baseState,
          node.text,
          '',
          {},
          {
            yearsPassed: node.yearsPassed,
            eventType: node.eventType,
            consequences: node.consequences,
            statusChanges: node.statusChanges,
            isDeath: false,
          }
        );
        setGameState(stateToSave);
      }

      // 8. 保存（确保 currentEvent 也被持久化）
      await saveGameState(stateToSave, saveId);
      transitionsUntilNext.current--; // 倒数，到0时插入过渡
    } catch (err) {
      toast.show('推进人生失败');
      setStoryState('命运正在展开');
    } finally {
      setGenerating(false);
    }
  }, [gameState, generating, choiceMode, aiEnabled, saveId, toast.show, appendStoryEntry]);

  // 选择事件选项
  const handleChoice = useCallback(async (choiceIndex: number) => {
    if (!gameState || !gameState.currentEvent || !choiceMode) return;

    const event = gameState.currentEvent;
    const choice = event.choices[choiceIndex];
    if (!choice) return;

    setChoiceMode(false);
    setStoryState('命运正在展开');

    // 1. 构建属性效果文本
    const effectParts: string[] = [];
    (Object.keys(choice.effects) as Array<keyof AttributeEffects>).forEach((key) => {
      const val = choice.effects[key];
      if (val && val !== 0) {
        effectParts.push(`${CHOICE_EFFECT_LABELS[key]}${val > 0 ? '+' : ''}${val}`);
        statBump.trigger(key);
      }
    });
    const effectInline = effectParts.length > 0 ? `  · ${effectParts.join('，')}` : '';

    // 2. 添加选择记录（跳过打字动画，直接显示全文 + 效果）
    appendStoryEntry(`选择了 ${CHOICE_KEYS[choiceIndex]}：${choice.text}${effectInline}`, 'choice', undefined, true);

    // 3. 显示属性变化 toast
    if (effectParts.length > 0) {
      toast.show(effectParts.join(' '));
    }
    let newState: GameState = {
      ...gameState,
      character: applyChoiceEffects(gameState.character, choice.effects),
      currentEvent: null,
    };

    // 4. 添加到历史（保存叙事文本）—— 包含 event 携带的完整元数据
    newState = addHistoryEntry(
      newState,
      event.narrative,
      choice.text,
      choice.effects,
      {
        yearsPassed: event.yearsPassed,
        eventType: event.eventType,
        consequences: event.consequences,
        statusChanges: event.statusChanges,
      }
    );

    // 5. 检查死亡
    const derived = calculateDerivedStats(newState.character);
    if (newState.character.age >= derived.lifespan) {
      newState = {
        ...newState,
        character: { ...newState.character, isAlive: false },
        gameStatus: 'dead',
      };
      toast.show(`${newState.character.name} 寿终正寝`);
    }

    setGameState(newState);
    // 选择了之后，重置抉择计数器（随机 5-8）
    choiceCounterRef.current = Math.floor(Math.random() * 4) + 5;
    await saveGameState(newState, saveId);
    if (newState.gameStatus !== 'dead') transitionsUntilNext.current--;
  }, [gameState, choiceMode, saveId, toast.show, statBump.trigger, appendStoryEntry]);

  // 获取显示文本（打字机效果）
  const getDisplayText = (entry: typeof storyEntries[0], index: number) => {
    if (typedEntries.has(index)) return entry.text;
    return displayTexts[index] || '';
  };

  // 判断是否正在打字
  const isEntryTyping = (index: number) => {
    return typingRef.current.index === index;
  };

  if (loading) {
    return (
      <div className="relative w-full h-screen flex items-center justify-center" style={{ background: '#eee9df' }}>
        <div style={{ color: '#948879', fontSize: '14px', letterSpacing: '2px' }}>加载中...</div>
      </div>
    );
  }

  if (!gameState) return null;

  const { character, currentEvent, gameStatus } = gameState;

  // 按钮文案
  const getBtnText = () => {
    if (generating) return '命线书写中';
    if (!aiChecked) return '命运加载中';
    if (!aiEnabled) return '请先配置 AI';
    if (choiceMode) return '等待抉择';
    return '拨动命线';
  };

  return (
    <div className="game-page" style={pageStyles.page}>
      <div style={pageStyles.bgLayer} />
      <div style={pageStyles.textureLayer} />

      <div style={pageStyles.sigil}>
        <span style={pageStyles.sigilLine} />
      </div>

      <main className="app" style={pageStyles.app}>
        {/* TopBar */}
        <header style={pageStyles.topbar}>
          <button style={pageStyles.iconBtn} onClick={() => navigate('/')}>
            ‹
          </button>
          <div style={pageStyles.topIdentity}>
            <div style={pageStyles.topName}>
              <b style={pageStyles.topNameB}>{character.name}</b>
              <span style={pageStyles.topNameSpan}>{character.age} 岁</span>
            </div>
            <div style={pageStyles.topMeta}>
              {character.world} / {character.gender === 'male' ? '男' : character.gender === 'female' ? '女' : '未知'}
              {character.talents.length > 0 && ` / 天赋：${typeof character.talents[0] === 'object' ? (character.talents[0] as any).name : character.talents[0]}`}
            </div>
          </div>
          <button
            style={pageStyles.iconBtn}
            onClick={() => toast.show('命运日志已封存')}
          >
            印
          </button>
        </header>

        {/* 属性条 */}
        <div style={pageStyles.statStrip}>
          {ATTR_LABELS.map((attr) => {
            const value = character.attributes[attr.key as keyof typeof character.attributes];
            return (
              <div
                key={attr.key}
                style={pageStyles.attr}
                className={statBump.bumps[attr.key] ? 'attr-bump' : ''}
              >
                <em style={pageStyles.attrEm(statBump.bumps[attr.key])}>+1</em>
                <b style={pageStyles.attrB}>{String(value).padStart(2, '0')}</b>
                <span style={pageStyles.attrSpan}>{attr.label}</span>
              </div>
            );
          })}
        </div>

        {/* 故事面板 */}
        <section style={pageStyles.storyPanel}>
          <div style={pageStyles.storyHead}>
            <div style={pageStyles.state}>
              {storyState}
            </div>
            <div style={pageStyles.nodeCode}>
              FRAGMENT {String(currentFragment).padStart(3, '0')}
            </div>
          </div>

          {/* 故事滚动区 */}
          <div ref={storyScrollRef} style={pageStyles.storyScroll}>
            {storyEntries.map((entry, i) => (
              <article
                key={i}
                style={pageStyles.entry(entry.type)}
                className="story-entry"
              >
                <p style={pageStyles.entryP(entry.type)}>
                  {entry.type === 'choice'
                    ? (() => {
                        const text = getDisplayText(entry, i);
                        const sepIndex = text.indexOf('  · ');
                        if (sepIndex > -1) {
                          return (
                            <>
                              {text.slice(0, sepIndex)}
                              <span style={pageStyles.choiceEffect}>{text.slice(sepIndex)}</span>
                            </>
                          );
                        }
                        return text;
                      })()
                    : getDisplayText(entry, i)
                  }
                  {isEntryTyping(i) && <span style={pageStyles.typingCursor} />}
                </p>
              </article>
            ))}
          </div>

          {/* AI 思考中 */}
          {generating && (
            <div style={pageStyles.thinking}>
              <span style={pageStyles.spinner} />
              <span>AI 正在续写命运片段……</span>
            </div>
          )}

          {/* 选择框 */}
          {choiceMode && currentEvent && (
            <div style={pageStyles.choiceBox}>
              <div style={pageStyles.choiceTitle}>
                <span>命运分歧</span>
                <span>Choose One</span>
              </div>
              {currentEvent.choices.slice(0, 3).map((choice, i) => {
                const effectKey = Object.keys(choice.effects)[0];
                const effectLabel = effectKey ? CHOICE_EFFECT_LABELS[effectKey] : '';
                return (
                  <button
                    key={choice.id}
                    style={pageStyles.choice}
                    onClick={() => handleChoice(i)}
                    className="choice-btn"
                  >
                    <i style={pageStyles.choiceI}>{CHOICE_KEYS[i]}</i>
                    <span style={pageStyles.choiceText}>{choice.text}</span>
                    <em style={pageStyles.choiceEm}>{effectLabel ? `+${effectLabel}` : ''}</em>
                  </button>
                );
              })}
            </div>
          )}

          {/* 底部操作 */}
          <div style={pageStyles.storyAction}>
            {gameStatus === 'playing' && !choiceMode && (
              <button
                style={{
                  ...pageStyles.btnPrimary,
                  opacity: !aiEnabled || !aiChecked || generating ? 0.42 : 1,
                  cursor: !aiEnabled || !aiChecked || generating ? 'not-allowed' : 'pointer',
                  animation: !aiEnabled || generating ? 'none' : 'pulseText 1.55s ease-in-out infinite',
                }}
                disabled={!aiEnabled || !aiChecked || generating}
                onClick={handleContinueLife}
              >
                {getBtnText()}
              </button>
            )}
            {gameStatus === 'dead' && (
              <div style={{ display: 'grid', gap: '8px' }}>
                <button
                  style={pageStyles.btnPrimary}
                  onClick={() => navigate(`/settlement?saveId=${saveId}`)}
                >
                  查看人生总结
                </button>
                <button
                  style={{ ...pageStyles.btnPrimary, color: '#948879', letterSpacing: '3px', fontSize: '13px' }}
                  onClick={() => navigate('/creation')}
                >
                  开启新轮回
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Toast */}
      <div style={pageStyles.toast(toast.visible)} className={toast.visible ? 'toast-show' : ''}>
        {toast.text}
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.82; }
          50% { transform: translateX(-50%) scale(1.035); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseText {
          0%, 100% { opacity: .38; }
          50% { opacity: 1; }
        }
        .story-entry {
          animation: fadeUp .28s ease both;
        }
        .choice-btn:hover {
          border-color: rgba(122,32,32,0.40) !important;
          background: rgba(122,32,32,0.06) !important;
        }
        .choice-btn:active {
          transform: translateX(3px);
          border-color: rgba(122,32,32,0.40) !important;
          background: rgba(122,32,32,0.06) !important;
          color: #221d18 !important;
        }
        .attr-bump em {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .toast-show {
          opacity: 1 !important;
          transform: translateX(-50%) translateY(0) !important;
        }
        @media (min-width: 768px) {
          body { display: flex; align-items: center; justify-content: center; background: #d4c8b8; }
          .game-page { width: 430px; height: 860px; max-height: 96vh; background: #eee9df; box-shadow: 0 30px 100px rgba(34,29,24,0.24); }
        }
      `}</style>
    </div>
  );
}

// ==================== 样式对象 ====================
const pageStyles: Record<string, any> = {
  page: {
    position: 'relative',
    width: '100%',
    height: '100vh',
    background: '#eee9df',
    color: '#221d18',
    fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
    overflow: 'hidden',
  },
  bgLayer: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    background: `
      radial-gradient(circle at 50% -12%, rgba(122,32,32,0.13), transparent 34%),
      radial-gradient(circle at 8% 78%, rgba(159,124,62,0.18), transparent 31%),
      radial-gradient(circle at 92% 80%, rgba(34,29,24,0.08), transparent 30%),
      linear-gradient(180deg, #f4efe6 0%, #ebe3d5 46%, #ddd1bf 100%)
    `,
    zIndex: 0,
  },
  textureLayer: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    opacity: 0.17,
    backgroundImage: `
      linear-gradient(90deg, rgba(34,29,24,0.12) 1px, transparent 1px),
      linear-gradient(0deg, rgba(34,29,24,0.09) 1px, transparent 1px),
      repeating-radial-gradient(circle at 20% 20%, rgba(34,29,24,0.13) 0 1px, transparent 1px 4px)
    `,
    backgroundSize: '74px 74px, 74px 74px, 18px 18px',
    mixBlendMode: 'multiply',
    zIndex: 0,
  },
  sigil: {
    position: 'absolute',
    top: '68px',
    left: '50%',
    width: '336px',
    height: '336px',
    transform: 'translateX(-50%)',
    border: '1px solid rgba(34,29,24,0.08)',
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: 0,
    animation: 'breathe 5.8s ease-in-out infinite',
  },
  sigilLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: '1px',
    height: '100%',
    background: 'rgba(34,29,24,0.045)',
    transformOrigin: 'center',
  },
  app: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    height: '100vh',
    padding: '12px 18px 16px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  topbar: {
    display: 'grid',
    gridTemplateColumns: '26px 1fr 26px',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '7px',
    order: 1,
  },
  iconBtn: {
    width: '26px',
    height: '26px',
    border: '1px solid rgba(34,29,24,0.18)',
    background: 'rgba(248,244,236,0.22)',
    color: '#221d18',
    fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
    fontSize: '13px',
    cursor: 'pointer',
    transition: '.24s ease',
    display: 'grid',
    placeItems: 'center',
  },
  topIdentity: {
    minWidth: 0,
    textAlign: 'center',
  },
  topName: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: '9px',
    lineHeight: 1,
    marginBottom: '4px',
  },
  topNameB: {
    fontSize: '20px',
    fontWeight: 400,
    letterSpacing: '4px',
  },
  topNameSpan: {
    color: '#7a2020',
    fontSize: '16px',
    fontWeight: 300,
    letterSpacing: '1px',
  },
  topMeta: {
    color: '#948879',
    fontSize: '10px',
    letterSpacing: '1.4px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  statStrip: {
    order: 2,
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    borderTop: '1px solid rgba(34, 29, 24, 0.13)',
    borderBottom: '1px solid rgba(34, 29, 24, 0.13)',
    marginBottom: '7px',
    background: 'rgba(248,244,236,0.14)',
  },
  attr: {
    position: 'relative',
    textAlign: 'center',
    padding: '5px 0 5px',
    borderRight: '1px solid rgba(34, 29, 24, 0.13)',
  },
  attrEm: (active: boolean) => ({
    position: 'absolute',
    top: '-10px',
    right: '7px',
    color: '#3e6a4b',
    fontStyle: 'normal',
    fontSize: '12px',
    opacity: active ? 1 : 0,
    transform: active ? 'translateY(0)' : 'translateY(6px)',
    transition: '.35s ease',
  }),
  attrB: {
    display: 'block',
    fontSize: '16px',
    lineHeight: 1,
    fontWeight: 300,
    color: '#221d18',
  },
  attrSpan: {
    display: 'block',
    marginTop: '4px',
    color: '#948879',
    fontSize: '8px',
    letterSpacing: '1.2px',
  },
  storyPanel: {
    order: 3,
    position: 'relative',
    flex: '1 1 auto',
    minHeight: 0,
    border: '1px solid rgba(34, 29, 24, 0.28)',
    background: `
      linear-gradient(180deg, rgba(248,244,236,0.58), rgba(238,233,223,0.34)),
      radial-gradient(circle at 50% 8%, rgba(159,124,62,0.11), transparent 34%)
    `,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 12px 42px rgba(34,29,24,0.08)',
  },
  storyHead: {
    position: 'relative',
    zIndex: 1,
    padding: '11px 13px 9px',
    borderBottom: '1px solid rgba(34, 29, 24, 0.13)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  state: {
    color: '#7a2020',
    fontSize: '12px',
    letterSpacing: '2px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  nodeCode: {
    color: '#948879',
    fontSize: '11px',
    letterSpacing: '1.5px',
  },
  storyScroll: {
    position: 'relative',
    zIndex: 1,
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '18px 16px 12px',
    scrollbarWidth: 'none',
    scrollBehavior: 'smooth',
  },
  entry: (type: string) => ({
    position: 'relative',
    marginBottom: '14px',
    paddingLeft: '14px',
    borderLeft: `1px solid ${
      type === 'choice'
        ? 'rgba(159,124,62,0.58)'
        : type === 'system'
        ? 'rgba(34,29,24,0.18)'
        : type === 'error'
        ? 'rgba(122,32,32,0.50)'
        : type === 'result'
        ? 'rgba(62,106,75,0.40)'
        : 'rgba(122,32,32,0.28)'
    }`,
    animation: 'fadeUp .28s ease both',
  }),
  entryP: (type: string) => ({
    margin: 0,
    color: type === 'error' ? '#7a2020' : type === 'result' ? '#3e6a4b' : type === 'choice' ? '#8a6a2e' : '#5a5047',
    fontFamily: "'Noto Serif SC', serif",
    fontSize: '15px',
    lineHeight: 1.9,
    letterSpacing: '.8px',
  }),
  typingCursor: {
    display: 'inline-block',
    width: '1px',
    height: '1em',
    marginLeft: '3px',
    background: '#7a2020',
    verticalAlign: '-2px',
    animation: 'blink 1s steps(1) infinite',
  },
  thinking: {
    position: 'relative',
    zIndex: 1,
    padding: '0 15px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    color: '#948879',
    fontSize: '12px',
    letterSpacing: '1.6px',
  },
  spinner: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '1px solid rgba(122,32,32,.22)',
    borderTopColor: '#7a2020',
    animation: 'spin .9s linear infinite',
    flexShrink: 0,
  },
  choiceBox: {
    position: 'relative',
    zIndex: 2,
    padding: '10px 12px 12px',
    borderTop: '1px solid rgba(34, 29, 24, 0.13)',
    background: 'rgba(238,233,223,0.72)',
    display: 'grid',
    gap: '8px',
  },
  choiceTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#948879',
    fontSize: '11px',
    letterSpacing: '1.5px',
    marginBottom: '1px',
  },
  choice: {
    width: '100%',
    border: '1px solid rgba(34, 29, 24, 0.13)',
    background: 'rgba(248,244,236,0.36)',
    color: '#71d993',
    minHeight: '42px',
    padding: '9px 10px',
    display: 'grid',
    gridTemplateColumns: '22px 1fr auto',
    gap: '8px',
    alignItems: 'center',
    textAlign: 'left',
    fontFamily: "'Noto Serif SC', serif",
    fontSize: '12px',
    lineHeight: 1.45,
    cursor: 'pointer',
    transition: '.24s ease',
  },
  choiceI: {
    fontStyle: 'normal',
    color: '#7a2020',
    fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
    fontSize: '14px',
  },
  choiceText: {
    color: '#5a5047',
  },
  choiceEffect: {
    color: '#3e6a4b',
    fontWeight: 500,
    letterSpacing: '0.5px',
  },
  choiceEm: {
    fontStyle: 'normal',
    color: '#948879',
    fontSize: '11px',
    whiteSpace: 'nowrap',
  },
  storyAction: {
    position: 'relative',
    zIndex: 2,
    padding: '6px 12px 12px',
    borderTop: 'none',
    background: 'transparent',
  },
  btnPrimary: {
    width: '100%',
    height: '42px',
    border: 'none',
    background: 'transparent',
    color: '#7a2020',
    fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
    fontSize: '15px',
    letterSpacing: '5px',
    cursor: 'pointer',
    transition: '.24s ease',
  },
  toast: (visible: boolean) => ({
    position: 'fixed',
    left: '50%',
    bottom: '88px',
    transform: `translateX(-50%) ${visible ? 'translateY(0)' : 'translateY(14px)'}`,
    opacity: visible ? 1 : 0,
    zIndex: 30,
    pointerEvents: 'none',
    background: 'rgba(34,29,24,0.92)',
    color: '#f8f4ec',
    padding: '11px 17px',
    fontSize: '13px',
    letterSpacing: '2px',
    transition: '.24s ease',
    whiteSpace: 'nowrap',
  }),
};
