import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';
import { DataEngine } from './core/engine/data-engine';

// 基础环境信息获取
const testEnv = process.env.test_env || 'preprod';
const authFile = `output/auth/auth-${testEnv}.json`;

// 动态生成统一的执行输出目录
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19).replace('T', '_');
const runReportDir = `output/reports/run_${timestamp}`;
process.env.RUN_REPORT_DIR = runReportDir;
process.env.ALLURE_RESULTS_DIR = `${runReportDir}/allure-results`;


// 获取项目基础配置的辅助函数
const getProjectConfig = (projectName: string) => {
  const dataEngine = DataEngine.getInstance();
  const mergedData = dataEngine.getMergedData(projectName);
  const config = mergedData.config || {};
  return {
    uiBase: config.uiBase,
    apiBase: config.apiBase
  };
};

/**
 * Playwright 配置文件: 核心环境与执行策略配置
 */
export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 12 : undefined,
  outputDir: 'output/results',
  
  // 核心报告器配置
  reporter: [
    ['list'],
    ['html', { outputFolder: `${runReportDir}/playwright-report`, open: 'never' }],
    ['allure-playwright', { outputFolder: `${runReportDir}/allure-results` }],
    [require.resolve('./core/reporters/premium-reporter.ts')]
  ],

  use: {
    trace: 'retain-on-failure', // 失败时保留链路追踪
    video: 'retain-on-failure', // 失败时保留视频录制
    screenshot: 'on',           // 开启截图
  },

  projects: [
    {
      name: 'auth-setup',
      testMatch: 'core/auth/**/*.setup.ts',
    },
    {
      name: 'research-ui',
      testMatch: [
        'projects/researchtool/tests/**/*-ui.test.ts'
      ],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: getProjectConfig('researchtool').uiBase,
        storageState: authFile,
      },
      dependencies: ['auth-setup'],
    },
    {
      name: 'dbdata-ui',
      testMatch: [
        'projects/dbdata/tests/**/*-ui.test.ts'
      ],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: getProjectConfig('dbdata').uiBase,
      },
    },
    {
      name: 'research-api',
      testMatch: 'projects/researchtool/tests/**/*-api.test.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: getProjectConfig('researchtool').apiBase,
        storageState: authFile,
      },
      dependencies: ['auth-setup'],
    },
  ],
});
