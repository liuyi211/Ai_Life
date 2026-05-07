/**
 * 简单的内存缓存服务（带 TTL）
 * 用于缓存 AI 生成的结果，减少重复请求
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private pendingGenerations = new Map<string, Promise<T>>();
  private defaultTTL: number;

  constructor(defaultTTLMs: number = 60 * 60 * 1000) {
    this.defaultTTL = defaultTTLMs;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTTL;
    this.cache.set(key, { value, expiresAt: Date.now() + ttl });
  }

  /**
   * 获取或生成缓存值（防竞态）
   * - 缓存命中 → 直接返回
   * - 正在生成中 → await 同一个 Promise（不会重复触发）
   * - 未命中也不在生成 → 调用 generator 生成并缓存
   */
  async getOrGenerate(
    key: string,
    generator: () => Promise<T>,
    ttlMs?: number,
  ): Promise<T> {
    // 1. 缓存命中
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    // 2. 正在生成中，复用已有 Promise
    const pending = this.pendingGenerations.get(key);
    if (pending) return pending;

    // 3. 新生成
    const promise = generator()
      .then((result) => {
        this.set(key, result, ttlMs);
        this.pendingGenerations.delete(key);
        return result;
      })
      .catch((err) => {
        this.pendingGenerations.delete(key);
        throw err;
      });

    this.pendingGenerations.set(key, promise);
    return promise;
  }

  /**
   * 删除指定键
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 清理过期条目
   */
  cleanup(): number {
    const now = Date.now();
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * 获取缓存统计
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * 生成缓存键
 * 基于用户ID、角色状态和最近历史
 */
export function generateCacheKey(params: {
  userId: string;
  character: any;
  lifeStatus: any;
  history: any[];
  stage: string;
}): string {
  const { userId, character, lifeStatus, history, stage } = params;

  // 取最近3条历史作为上下文标识
  const recentHistory = (history || []).slice(-3);
  const historyHash = recentHistory
    .map((h) => {
      const age = h.year ?? h.age ?? 0;
      const narrative = (h.narrative || h.event || '').slice(0, 30);
      return `${age}:${narrative}`;
    })
    .join('|');

  // 关键状态字段
  const statusKey = [
    lifeStatus?.identity || '',
    lifeStatus?.location || '',
    lifeStatus?.ability || '',
  ].join(':');

  // 角色关键字段
  const charKey = [
    character?.name || '',
    character?.world || '',
    character?.age || 0,
    character?.lifeStage || stage || '',
  ].join(':');

  // 组合成最终键
  const rawKey = `${userId}:${charKey}:${statusKey}:${historyHash}`;

  // 使用简单的哈希函数缩短键长度
  return `ai_cache_${hashString(rawKey)}`;
}

/**
 * 简单的字符串哈希函数（djb2）
 */
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & 0xffffffff;
  }
  return hash.toString(16);
}

// 全局 AI 结果缓存实例
export const aiResultCache = new MemoryCache<any>(60 * 60 * 1000); // 1小时TTL

// 每 10 分钟自动清理一次过期缓存
setInterval(() => {
  const cleaned = aiResultCache.cleanup();
  if (cleaned > 0) {
    console.log(`[Cache] 清理了 ${cleaned} 个过期缓存条目`);
  }
}, 10 * 60 * 1000);
