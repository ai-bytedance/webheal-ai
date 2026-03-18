import { Page } from '@playwright/test';
import { LoginPage } from '../../projects/researchtool/pages/auth/login.page';
import { AIHandler } from './ai-handler';
import { LoginAPI } from '../../projects/researchtool/api/auth/login.api';
import { APIRequestContext } from '@playwright/test';

export class PageRegistry {
  private static pages: Map<string, any> = new Map();

  static register(name: string, pageClass: any) {
    this.pages.set(name, pageClass);
  }

  static getPageInstance(name: string, page: Page | APIRequestContext): any {
    const PageClass = this.pages.get(name);
    if (!PageClass) {
      throw new Error(`在注册表中未找到页面对象 "${name}"。请检查 core/engine/page-registry.ts`);
    }
    
    // 实例化逻辑：根据构造函数参数类型自动注入关联上下文
    const instance = new PageClass(page);
    
    // 如果是 UI Page，则尝试注入 AI 自愈处理器
    if ('setAIHandler' in instance && 'on' in (page as any)) {
      (instance as any).setAIHandler(new AIHandler(page as Page));
    }
    
    return instance;
  }
}

// 自动注册可用页面
PageRegistry.register('LoginPage', LoginPage);
PageRegistry.register('LoginAPI', LoginAPI);
