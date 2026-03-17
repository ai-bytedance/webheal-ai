import { test as setup } from '@playwright/test';
import * as path from 'path';
import { DataEngine } from '../engine/data-engine';

/**
 * 自动化身份验证注入：用于保存登录状态以供后续 UI 自动化测试复用
 */
const authFile = path.join(__dirname, '../../auth.json');

setup('用户认证', async ({ request }) => {
  const dataEngine = DataEngine.getInstance();
  const mergedData = dataEngine.getMergedData();

  const apiBase = mergedData.config?.apiBase;
  const loginPath = '/user/user/login';
  const loginUrl = apiBase ? `${apiBase}${loginPath}` : null;

  if (!loginUrl) {
    throw new Error('[Auth-Setup] ❌ API_BASE_URL (from YAML) 未定义，请检查 data/common/ 路径下的环境配置');
  }

  console.log(`[Auth-Setup] 正在启动全局认证，目标地址: ${loginUrl}`);

  const response = await request.post(loginUrl, {
    data: {
      username: mergedData.user?.email, // 使用 YAML 中的统一账号 (环境特定值在 prod.yaml/preprod.yaml 中覆盖此 block)
      password: mergedData.user?.password
    }
  }).catch(() => null);

  if (!response?.ok()) {
    console.warn('[Auth-Setup] ⚠️ 登录接口调用失败，请检查 YAML 环境配置或网络。测试将继续尝试执行 UI 操作。');
  }

  await request.storageState({ path: authFile });
});
