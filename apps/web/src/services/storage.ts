import type { GameState } from '../engine/gameEngine';
import { serializeGameState } from '../engine/gameEngine';

const STORAGE_KEY = 'life-echo-game-backup';

interface BackupData {
  saveId: string;
  state: ReturnType<typeof serializeGameState>;
  timestamp: number;
  version: number;
}

/**
 * 将游戏状态保存到 localStorage 作为本地备份
 * 与后端保存形成双保险，确保页面刷新/关闭后不丢失进度
 */
export function saveLocalBackup(state: GameState, saveId: string): void {
  try {
    const data: BackupData = {
      saveId,
      state: serializeGameState(state),
      timestamp: Date.now(),
      version: 1,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Local backup save failed:', err);
  }
}

/**
 * 从 localStorage 加载本地备份
 * 返回 null 表示没有备份或备份已损坏
 */
export function loadLocalBackup(): BackupData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BackupData;
    if (!validateBackup(parsed)) return null;
    return parsed;
  } catch (err) {
    console.error('Local backup load failed:', err);
    return null;
  }
}

/**
 * 清除本地备份
 * 在创建新角色或确认后端同步成功后调用
 */
export function clearLocalBackup(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Local backup clear failed:', err);
  }
}

/**
 * 验证备份数据结构的完整性
 * 确保恢复时不会拿到损坏的数据
 */
function validateBackup(data: unknown): data is BackupData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  // 必须字段检查
  if (typeof d.saveId !== 'string' || !d.saveId) return false;
  if (typeof d.timestamp !== 'number' || d.timestamp <= 0) return false;
  if (typeof d.version !== 'number') return false;
  if (!d.state || typeof d.state !== 'object') return false;

  // state 字段检查
  const state = d.state as Record<string, unknown>;
  if (!state.character || typeof state.character !== 'object') return false;
  const character = state.character as Record<string, unknown>;
  if (typeof character.name !== 'string') return false;
  if (typeof character.age !== 'number' || character.age < 0) return false;
  if (!Array.isArray(state.history)) return false;

  return true;
}


