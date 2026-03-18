import { test as base, expect, APIRequestContext } from '@playwright/test';
import { AIHandler } from '../engine/ai-handler';
import { UserAPI } from '../api';
import { ProjectDataFactory } from '../data-factory';

/**
 * MyFixtures: 统一定义框架提供的 Fixtures 注入项
 */
type MyFixtures = {
  stagehand: AIHandler; // AI 自愈处理器
  userApi: UserAPI;           // 用户模块 API 对象
  dataFactory: ProjectDataFactory; // 数据工厂
};

export const test = base.extend<MyFixtures>({
  // 初始化 AI 自愈处理器
  stagehand: async ({ page }, use) => {
    const handler = new AIHandler(page);
    await handler.init();
    await use(handler);
  },

  // 注入用户 API
  userApi: async ({ request }: { request: APIRequestContext }, use: (r: UserAPI) => Promise<void>) => {
    await use(new UserAPI(request));
  },

  // 注入数据工厂
  dataFactory: async ({ request }: { request: APIRequestContext }, use: (f: ProjectDataFactory) => Promise<void>) => {
    await use(new ProjectDataFactory(request));
  },
});

export { expect };
