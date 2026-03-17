import { APIRequestContext } from '@playwright/test';

/**
 * BaseAPI: 基础 API 交互类，封装通用的 HTTP 请求方法
 */
export class BaseAPI {
  constructor(protected request: APIRequestContext) {}

  protected async get(url: string, params?: Record<string, string>) {
    return this.request.get(url, { params });
  }

  protected async post(url: string, data?: any) {
    return this.request.post(url, { data });
  }

  protected async put(url: string, data?: any) {
    return this.request.put(url, { data });
  }

  protected async delete(url: string) {
    return this.request.delete(url);
  }
}
