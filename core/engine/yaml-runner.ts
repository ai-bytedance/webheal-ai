import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { PageRegistry } from './page-registry';
import { DataEngine } from './data-engine';

/**
 * YamlRunner: 核心解析引擎
 * 负责解析 YAML 用例并映射到具体的 Page Object 动作
 */
export class YamlRunner {
  static async runYaml(yamlPath: string) {
    if (!fs.existsSync(yamlPath)) {
      throw new Error(`YAML file not found at path: ${yamlPath}`);
    }

    const content = fs.readFileSync(yamlPath, 'utf8');
    const data = yaml.load(content) as any;
    const moduleName = data.module || path.basename(yamlPath, '.yaml');

    if (!data.cases || !Array.isArray(data.cases)) {
      console.warn(`[YamlRunner] Warning: No test cases found in ${yamlPath}`);
      return;
    }

    const dataEngine = DataEngine.getInstance();

    test.describe(moduleName, () => {
      // 通过统一引擎加载合并后的数据 (SSOT)
      const mergedData = dataEngine.getMergedData(yamlPath, data.variables);

      // 模块级标签
      const moduleTags = Array.isArray(data.tags) ? data.tags : [];

      for (let testCase of data.cases) {
        // 使用引擎解析变量占位符
        testCase = dataEngine.interpolate(testCase, mergedData);

        // 合并用例级标签与模块级标签并去重
        const caseTags = Array.isArray(testCase.tags) ? testCase.tags : [];
        const combinedTags = [...new Set([...moduleTags, ...caseTags])];
        
        // 生成标签前缀供 --grep 使用: "@smoke @P0 "
        const tagPrefix = combinedTags.length > 0 
          ? combinedTags.map(t => `@${t}`).join(' ') + ' ' 
          : '';

        test(tagPrefix + testCase.name, async ({ page, request }, testInfo) => {
          // 为精品报告提供元数据
          testInfo.annotations.push({ type: 'module', description: moduleName });
          testInfo.annotations.push({ type: 'projectPath', description: yamlPath });
          
          // 将标签通过 annotations 传递给 Reporter，方便精确渲染徽章
          if (combinedTags.length > 0) {
            testInfo.annotations.push({ type: 'tags', description: JSON.stringify(combinedTags) });
          }

          for (const stepData of testCase.steps) {
            await test.step(stepData.step, async () => {
              // 核心转换逻辑：根据类名后缀自动切换上下文（UI Page vs API Object）
              const context = stepData.page.endsWith('API') ? request : page;
              const pageInstance = PageRegistry.getPageInstance(stepData.page, context);
              
              const action = stepData.action;
              const params = stepData.params || [];

              if (!(action in pageInstance)) {
                throw new Error(
                  `[YamlRunner Error] Action "${action}" is not defined in Page Object "${stepData.page}".\n` +
                  `Available methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(pageInstance)).join(', ')}`
                );
              }

              // 执行映射的方法
              const result = await (pageInstance as any)[action](...params);

              let responseBody: any = null;
              // 自动捕获 API 响应内容
              if (result && typeof result === 'object' && 'json' in result && typeof result.json === 'function') {
                try {
                  responseBody = await result.json();
                  await testInfo.attach(`API Response: ${stepData.step}`, {
                    body: JSON.stringify(responseBody, null, 2),
                    contentType: 'application/json'
                  });
                } catch (e) {
                  // 如果不是 JSON，尝试作为文本读取
                  const textBody = await result.text().catch(() => '无法读取响应体');
                  await testInfo.attach(`API Response: ${stepData.step}`, {
                    body: textBody,
                    contentType: 'text/plain'
                  });
                }
              }

              // 1. 自动捕获：如果方法名包含验证关键词且执行成功，视作一次业务断言通过
              const isValidationMethod = /verify|check|assert/i.test(action);
              const passedAsserts: any[] = [];
              
              if (isValidationMethod) {
                // 优化：将技术方法名映射为易于理解的业务描述
                const actionDescMap: Record<string, string> = {
                  'verifyRendering': '页面核心组件渲染',
                  'verifyLoginHeader': '登录页标题展示',
                  'verifyInputWithPlaceholder': '输入框占位符正确性',
                  'verifyButton': '操作按钮可用性',
                  'selectIdentity': '身份入口切换',
                  'verifyQRCodeVisibility': '微信二维码渲染状态'
                };
                const readableKey = actionDescMap[action] || `业务验证(${action})`;

                passedAsserts.push({ 
                  key: readableKey, 
                  expected: '通过验证', 
                  actual: '符合预期',
                  isUI: !stepData.page.endsWith('API')
                });
              }

              // 2. 显式捕获：处理 YAML 中定义的 asserts 块
              if (stepData.asserts) {
                // 优先校验 API 响应，兜底校验方法返回值
                const targetForAssert = responseBody || result;
                
                if (targetForAssert && typeof targetForAssert === 'object') {
                  for (const [key, expectedValue] of Object.entries(stepData.asserts)) {
                    // 支持点号嵌套字段校验
                    const actualValue = key.split('.').reduce((o: any, i: string) => (o ? o[i] : undefined), targetForAssert);
                    // 支持特殊断言标识
                    if (expectedValue === '$notNull') {
                      expect(actualValue, `Assertion Failed on key: ${key}`).not.toBeNull();
                    } else if (expectedValue === '$exists') {
                      expect(actualValue, `Assertion Failed on key: ${key}`).toBeDefined();
                    } else {
                      expect(actualValue, `Assertion Failed on key: ${key}`).toBe(expectedValue);
                    }
                    
                    // 记录手动定义的成功断言
                    passedAsserts.push({ key, expected: expectedValue, actual: actualValue });
                  }
                } else if (stepData.asserts) {
                  // 如果有断言要求但没有可校验的对象，报错
                  throw new Error(`[YamlRunner Error] Cannot execute asserts because the step did not return a valid object/response.`);
                }
              }

              // 统一附加成功的断言信息
              if (passedAsserts.length > 0) {
                await testInfo.attach(`Step Asserts: ${stepData.step}`, {
                  body: JSON.stringify(passedAsserts),
                  contentType: 'application/json'
                });
              }

              // 自动截图逻辑：如果 YAML 中定义了 screenshot: true，则在步骤成功后执行
              if (stepData.screenshot === true) {
                const screenshotPath = testInfo.outputPath(`screenshot_${Date.now()}.png`);
                await page.screenshot({ path: screenshotPath, fullPage: true });
                await testInfo.attach(`Step Screenshot: ${stepData.step}`, {
                  path: screenshotPath,
                  contentType: 'image/png'
                });
              }
            });
          }
        });
      }
    });
  }
}
