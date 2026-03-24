import { Page } from '@playwright/test';
import { AIHandler } from './ai-handler';

/**
 * BasePage: 所有 Page Object 的基类
 * 提供 AI 处理器注入和通用的自愈操作逻辑
 */
export class BasePage {
  protected aiHandler: AIHandler | null = null;
  protected projectName: string = 'global';

  constructor(public readonly page: Page) {}

  /**
   * 设置项目名称，用于日志前缀
   */
  setProjectName(name: string) {
    this.projectName = name;
  }

  /**
   * 供 PageRegistry 调用，注入 AI 处理器
   */
  setAIHandler(handler: AIHandler) {
    this.aiHandler = handler;
  }

  /**
   * AI 自愈装饰器：当传统操作失败时，自动尝试 AI 修复
   * @param fallbackInstruction AI 动作指令
   * @param action 原始的 Playwright 操作
   */
  protected async selfHeal(fallbackInstruction: string, action: () => Promise<void>) {
    try {
      // 1. 尝试执行原始 Playwright 操作
      await action();
    } catch (error: any) {
      console.warn(`[${this.projectName}][Self-Healing] Action failed: ${error.message}`);
      
      if (this.aiHandler) {
        console.log(`[${this.projectName}][Self-Healing] Attempting AI recovery: "${fallbackInstruction}"`);
        // 2. 失败后使用 AI 兜底
        await this.aiHandler.act(fallbackInstruction);
      } else {
        throw error;
      }
    }
  }

  /**
   * AI 提取数据
   */
  protected async aiExtract(instruction: string) {
    if (this.aiHandler) {
      return await this.aiHandler.extract(instruction);
    }
    return null;
  }
}
