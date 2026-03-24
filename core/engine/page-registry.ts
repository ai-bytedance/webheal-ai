import { Page, APIRequestContext } from '@playwright/test';
import { LoginPage as ResearchLoginPage } from '../../projects/researchtool/pages/auth/login.page';
import { LoginAPI as ResearchLoginAPI } from '../../projects/researchtool/api/auth/login.api';
import { LoginPage as DbdataLoginPage } from '../../projects/dbdata/pages/auth/login.page';
import { RegisterPage as DbdataRegisterPage } from '../../projects/dbdata/pages/auth/register.page';
import { JournalEvaluationPage as DbdataJournalEvaluationPage } from '../../projects/dbdata/pages/journal_evaluation/journal_evaluation.page';
import { AIHandler } from './ai-handler';

export class PageRegistry {
  private static pages: Map<string, any> = new Map();

  /**
   * 注册页面对象
   * @param projectName 项目名称
   * @param name 页面对象名称 (如 LoginPage)
   * @param pageClass 类定义
   */
  static register(projectName: string, name: string, pageClass: any) {
    const key = `${projectName}:${name}`;
    this.pages.set(key, pageClass);
  }

  /**
   * 注册全局或核心页面对象
   */
  static registerGlobal(name: string, pageClass: any) {
    this.pages.set(name, pageClass);
  }

  static getPageInstance(projectName: string, name: string, page: Page | APIRequestContext): any {
    // 优先匹配项目私有页面，后兜底全局页面
    const projectKey = `${projectName}:${name}`;
    const PageClass = this.pages.get(projectKey) || this.pages.get(name);

    if (!PageClass) {
      throw new Error(`在注册表中未找到页面对象 "${name}" (项目: ${projectName})。请检查 core/engine/page-registry.ts 并确保已调用 register`);
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

// 自动注册可用页面 (researchtool 项目)
PageRegistry.register('researchtool', 'LoginPage', ResearchLoginPage);
PageRegistry.register('researchtool', 'LoginAPI', ResearchLoginAPI);

// 自动注册可用页面 (dbdata 项目)
PageRegistry.register('dbdata', 'LoginPage', DbdataLoginPage);
PageRegistry.register('dbdata', 'RegisterPage', DbdataRegisterPage);
PageRegistry.register('dbdata', 'JournalEvaluationPage', DbdataJournalEvaluationPage);
