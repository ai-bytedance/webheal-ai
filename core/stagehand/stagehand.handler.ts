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
    
    // 移除 STAGEHAND_API_KEY 的强校验，因为 LOCAL 模式下只需要模型 Key (如 OPENAI_API_KEY)
    
    try {
      // 这里的配置支持通过 .env 切换模型（如 DeepSeek）
      const modelConfig = process.env.STAGEHAND_MODEL_NAME ? {
        modelProvider: (process.env.STAGEHAND_MODEL_TYPE || 'openai') as any,
        // Stagehand v3 要求 modelName 必须包含 provider 前缀，例如 "openai/deepseek-chat"
        modelName: process.env.STAGEHAND_MODEL_NAME.includes('/') 
          ? process.env.STAGEHAND_MODEL_NAME 
          : `${process.env.STAGEHAND_MODEL_TYPE || 'openai'}/${process.env.STAGEHAND_MODEL_NAME}`,
        clientOptions: { 
          baseURL: process.env.STAGEHAND_API_URL,
          apiKey: process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.STAGEHAND_API_KEY 
        },
      } : undefined;

      console.log('[Stagehand-Debug] Environment Check:', {
        STAGEHAND_MODEL_NAME: process.env.STAGEHAND_MODEL_NAME,
        STAGEHAND_API_URL: process.env.STAGEHAND_API_URL,
        HAS_KEY: !!(process.env.STAGEHAND_API_KEY || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY)
      });
      console.log('[Stagehand-Debug] Initializing with config:', JSON.stringify(modelConfig, (k, v) => k === 'apiKey' ? '***' : v, 2));

      this.stagehand = new Stagehand({
          env: "LOCAL",
          apiKey: process.env.STAGEHAND_API_KEY, 
          model: modelConfig as any,
      });
      await this.stagehand.init();
      this.isInitialized = true;
    } catch (error) {
      console.error('[Stagehand 初始化错误]', error);
    }
  }

  /**
   * 使用 AI 执行动作（自愈核心）
   * 如果 Stagehand 驱动不可用，回退到使用 LLM 直接分析 DOM 并找回定位器
   */
  async act(instruction: string) {
    if (!this.isInitialized) await this.init();
    
    console.log(`[AI-Act] Attempting: ${instruction}`);
    
    try {
      if (this.stagehand) {
        // 首先尝试 Stagehand 原生 act (如果环境允许共享)
        await this.stagehand.act(instruction, { page: this.page as any });
      } else {
        throw new Error('AI 引擎未初始化');
      }
    } catch (e: any) {
      console.warn(`[AI-Act] Stagehand Native Act failed, falling back to direct LLM healing. Error: ${e.message}`);
      
      // 自愈回退逻辑：获取 DOM -> 让 LLM 寻找定位器 -> 原生点击
      const html = await this.page.content();
      const prompt = `
        你是一个 UI 自动化专家。当前页面由于定位器失效需要自愈。
        操作指令: "${instruction}"
        
        请分析以下 HTML 片段，并返回一个最准确的 CSS 选择器来执行该操作。
        返回格式必须是 JSON: { "selector": "..." }
        
        HTML 片段 (已简化):
        ${html.substring(0, 50000)} // 截断以防 Token 溢出
      `;
      
      const response = await this.callLLM(prompt);
      const { selector } = JSON.parse(response);
      console.log(`[AI-Heal] LLM found new selector: ${selector}`);
      
      await this.page.locator(selector).first().click();
    }
  }

  /**
   * 调用 LLM (简单实现，支持 OpenAI 兼容接口)
   */
  private async callLLM(prompt: string): Promise<string> {
    const baseURL = process.env.STAGEHAND_API_URL || 'https://api.openai.com/v1';
    const apiKey = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.STAGEHAND_API_KEY;
    const model = process.env.STAGEHAND_MODEL_NAME || 'gpt-4o';

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * 使用 AI 提取数据
   */
  async extract(instruction: string) {
    if (!this.isInitialized) await this.init();
    console.log(`[AI-Extract] ${instruction}`);
    
    try {
      if (this.stagehand) {
        return await this.stagehand.extract(instruction, { page: this.page as any });
      }
    } catch (e: any) {
      console.warn(`[AI-Extract] Stagehand Native Extract failed. Error: ${e.message}`);
    }
    return null;
  }
}
