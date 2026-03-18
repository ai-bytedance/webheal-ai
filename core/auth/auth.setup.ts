import { test as setup } from '@playwright/test';
import * as path from 'path';
import { DataEngine } from '../engine/data-engine';

/**
 * 自动化身份验证注入：用于保存登录状态以供后续 UI 自动化测试复用
 */
// 同步 playwright.config.ts 的逻辑：按环境隔离 Session 文件
const testEnv = process.env.test_env || 'preprod';
const authFile = path.resolve(process.cwd(), `output/auth/auth-${testEnv}.json`);

setup('用户认证', async ({ request }) => {
  const dataEngine = DataEngine.getInstance();
  const mergedData = dataEngine.getMergedData();

  const apiBase = mergedData.config?.apiBase;
  const loginPath = '/user/user/login';
  const loginUrl = apiBase ? `${apiBase}${loginPath}` : null;

  if (!loginUrl) {
    throw new Error('[Auth-Setup] ❌ API_BASE_URL (from YAML) 未定义，请检查 data/common/ 路径下的环境配置');
  }

  console.log(`[Auth-Setup] 正在启动全局认证，目标环境: ${testEnv}`);
  console.log(`[Auth-Setup] 目标接口地址: ${loginUrl}`);

  // 确保输出目录存在
  const fs = require('fs');
  const dir = path.dirname(authFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const response = await request.post(loginUrl, {
    data: {
      username: mergedData.user?.email, // 使用 YAML 中的统一账号 (环境特定值在 prod.yaml/preprod.yaml 中覆盖此 block)
      password: mergedData.user?.password
    }
  }).catch((err) => {
    console.error(`[Auth-Setup] ❌ 登录请求异常: ${err.message}`);
    return null;
  });

  if (!response?.ok()) {
    const status = response?.status();
    const text = await response?.text().catch(() => '无法读取响应');
    console.warn(`[Auth-Setup] ⚠️ 登录接口失败 (状态码: ${status})。请检查 YAML 配置。`);
    console.warn(`[Auth-Setup] 接口返回: ${text}`);
  } else {
    console.log('[Auth-Setup] ✅ 登录成功，正在持久化 Session 状态...');
  }

  await request.storageState({ path: authFile });
});
