import { BaseAPI } from '../../../../core/api/base.api';

/**
 * LoginAPI: 处理登录与身份验证相关接口
 */
export class LoginAPI extends BaseAPI {
  /**
   * 调用登录接口
   * @param data 登录请求体
   * @param path 可选接口路径（支持从 YAML 注入实现解耦）
   */
  async login(data: { email: string; password: any; userType: number }, path: string = '/user/user/login') {
    console.log(`[LoginAPI] 正在调用登录接口，账号: ${data.email}，路径: ${path}`);
    return this.post(path, data);
  }
}
