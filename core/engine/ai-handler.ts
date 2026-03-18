import { Page } from '@playwright/test';
import { Stagehand } from '@browserbasehq/stagehand';

/**
 * AIHandler: 集成 AI 自愈能力的基础处理器
 */
export class AIHandler {
  private stagehand: Stagehand | null = null;
  private isInitialized = false;

  constructor(private page: Page) {}

  async init() {
    if (this.isInitialized) return;
    
    try {
      // 通过环境变量解析模型配置，优先使用 DeepSeek 或 OpenAI 兼容端点
      const modelConfig = process.env.STAGEHAND_MODEL_NAME ? {
        modelProvider: (process.env.STAGEHAND_MODEL_TYPE || 'openai') as any,
        // Stagehand v3 要求 modelName 必须包含 provider 前缀
        modelName: process.env.STAGEHAND_MODEL_NAME.includes('/') 
          ? process.env.STAGEHAND_MODEL_NAME 
          : `${process.env.STAGEHAND_MODEL_TYPE || 'openai'}/${process.env.STAGEHAND_MODEL_NAME}`,
        clientOptions: { 
          baseURL: process.env.STAGEHAND_API_URL,
          apiKey: process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.STAGEHAND_API_KEY 
        },
      } : undefined;

      console.log('[AI-Handler] 正在进行模型预热及配置检查...');

      this.stagehand = new Stagehand({
          env: "LOCAL",
          apiKey: process.env.STAGEHAND_API_KEY, 
          model: modelConfig as any,
      });
      await this.stagehand.init();
      this.isInitialized = true;
    } catch (error) {
      console.error('[AI Handler 初始化错误]', error);
    }
  }

  /**
   * 使用 AI 执行动作（自愈核心）
   * 如果 Stagehand 驱动不可用，回退至 LLM 直接分析 DOM
   */
  async act(instruction: string) {
    if (!this.isInitialized) await this.init();
    
    console.log(`[AI-Act] 尝试动作指令: "${instruction}"`);
    
    try {
      if (this.stagehand) {
        await this.stagehand.act(instruction, { page: this.page as any });
      } else {
        throw new Error('AI 引擎未就绪');
      }
    } catch (e: any) {
      console.warn(`[AI-Act] 原生执行失败，切换至 DOM 找回逻辑. 原因: ${e.message}`);
      
      const html = await this.page.content();
      const prompt = `
        你是一个 UI 自动化专家。当前页面由于定位器失效需要自愈。
        操作指令: "${instruction}"
        
        请分析以下 HTML 片段，并返回一个最准确的 CSS 选择器来执行该操作。
        返回格式必须是 JSON: { "selector": "..." }
        
        HTML 片段 (已简化):
        ${html.substring(0, 50000)}
      `;
      
      const response = await this.callLLM(prompt);
      const { selector } = JSON.parse(response);
      console.log(`[AI-Heal] 找到修正定位器: ${selector}`);
      
      await this.page.locator(selector).first().click();
    }
  }

  /**
   * 调用 LLM (支持 OpenAI 兼容接口，无硬编码)
   */
  private async callLLM(prompt: string): Promise<string> {
    const baseURL = process.env.STAGEHAND_API_URL;
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || process.env.STAGEHAND_API_KEY;
    // 关键修正：如果模型名包含斜杠 (如 openai/deepseek-chat)，剥离前缀以适配直接 API 调用
    const rawModel = process.env.STAGEHAND_MODEL_NAME || '';
    const model = rawModel.includes('/') ? rawModel.split('/')[1] : rawModel;

    if (!baseURL || !apiKey || !model) {
      throw new Error(`[AI-Handler] LLM 调用参数缺失: URL=${!!baseURL}, Key=${!!apiKey}, Model=${!!model}`);
    }

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
    if (data.error) {
      throw new Error(`LLM API 报错 (${model}): ${data.error.message}`);
    }
    
    return data.choices[0].message.content;
  }

  /**
   * 使用 AI 提取数据
   */
  async extract(instruction: string) {
    if (!this.isInitialized) await this.init();
    console.log(`[AI-Extract] 正在提取: ${instruction}`);
    
    try {
      if (this.stagehand) {
        return await this.stagehand.extract(instruction, { page: this.page as any });
      }
    } catch (e: any) {
      console.warn(`[AI-Extract] 提取失败: ${e.message}`);
    }
    return null;
  }
}
