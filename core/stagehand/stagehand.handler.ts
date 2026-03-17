import { Page } from '@playwright/test';
import { Stagehand } from '@browserbasehq/stagehand';

/**
 * StagehandHandler: 集成 AI 自愈能力的基础处理器
 */
export class StagehandHandler {
  private stagehand: Stagehand | null = null;
  private isInitialized = false;

  constructor(private page: Page) {}

  async init() {
    if (this.isInitialized) return;
    
    if (!process.env.STAGEHAND_API_KEY) {
      console.warn('[Stagehand] 未设置 STAGEHAND_API_KEY，AI 相关功能将受限。');
      return;
    }
    
    try {
      this.stagehand = new Stagehand({
          env: "LOCAL",
          apiKey: process.env.STAGEHAND_API_KEY,
          // 将 Playwright 的 page 传递给 Stagehand
          // 注意：实际生产中需要确保版本兼容性
      });
      await this.stagehand.init();
      this.isInitialized = true;
    } catch (error) {
      console.error('[Stagehand 初始化错误]', error);
    }
  }

  /**
   * 使用 AI 执行动作（自愈核心）
   */
  async act(instruction: string) {
    if (!this.isInitialized) await this.init();
    
    console.log(`[AI-Act] Attempting: ${instruction}`);
    if (this.stagehand) {
      // Stagehand 会分析 DOM 并尝试依据指令执行动作
      await (this.stagehand as any).page.act({ action: instruction });
    } else {
      console.error('[Stagehand] 无法执行动作：AI 引擎未初始化');
    }
  }

  /**
   * 使用 AI 提取数据
   */
  async extract(instruction: string) {
    if (!this.isInitialized) await this.init();
    
    console.log(`[AI-Extract] ${instruction}`);
    if (this.stagehand) {
      return await (this.stagehand as any).page.extract({ instruction });
    }
    return null;
  }
}
