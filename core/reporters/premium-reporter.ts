import { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult, TestStep } from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';
import { getReportStyles } from './report-styles';
import { getReportScripts } from './report-scripts';
import { DataEngine } from '../engine/data-engine';

/**
 * PremiumReporter: 高级精品测试报告生成器
 * 核心功能：
 * 1. 动态生成数值型执行编号
 * 2. 报告历史持久化存储与截图收割
 * 3. 资源相对路径引用，支持报告文件夹整体移动
 * 4. 侧边栏模块导航 + 悬浮收起功能
 * 5. 极致卡片美学：参考专业监控面板，采用大圆角、内阴影与渐变设计
 * 6. 全局搜索与实时过滤
 * 7. 智能测试结论生成
 */
class PremiumReporter implements Reporter {
  private tests: any[] = [];
  private startTime: number = Date.now();
  private readonly DEFAULT_PROJECT = 'WebHeal AI';
  private readonly DEFAULT_MODULE = '默认模块';

  onBegin(config: FullConfig, suite: Suite) {
    this.startTime = Date.now();
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const annotations = [...(test.annotations || []), ...(result.annotations || [])];
    const transformed = this.transformTestData(test, annotations);

    const testMetadata = {
      module: annotations.find(a => a.type === 'module')?.description || transformed.module,
      title: transformed.title,
      type: transformed.type
    };

    const steps = this.collectSteps(result.steps, testMetadata.type, result.attachments);

    this.tests.push({
      id: test.id,
      title: transformed.title,
      projectName: test.parent.project()?.name || this.DEFAULT_PROJECT,
      realProjectName: this.extractRealProjectName(test),
      module: testMetadata.module,
      category: transformed.category,
      status: result.status,
      duration: result.duration,
      startTime: result.startTime,
      steps: steps,
      error: this.stripAnsi(result.error?.message),
      semanticError: this.parseSemanticError(result.error?.message),
      attachments: result.attachments.map(a => ({
        name: a.name,
        body: a.body ? a.body.toString('utf8') : undefined,
        path: a.path,
        contentType: a.contentType
      })),
      type: transformed.type,
      tags: transformed.tags
    });
  }

  private extractRealProjectName(test: TestCase): string | null {
    const projectPathAnnotation = test.annotations.find(a => a.type === 'projectPath');
    const filePath = (projectPathAnnotation && typeof projectPathAnnotation.description === 'string')
      ? projectPathAnnotation.description
      : test.location.file;

    if (!filePath) return null;
    const match = filePath.match(/projects[\\\/]([^\\\/]+)[\\\/]/i);
    return match ? match[1] : null;
  }

  private transformTestData(test: TestCase, annotations: any[]) {
    let title = test.title;
    let module = this.DEFAULT_MODULE;
    let category = 'business';
    let type = 'ui'; // 默认为 UI 自动化
    let tags: string[] = [];

    // 提取标签信息
    const tagsAnnotation = annotations.find(a => a.type === 'tags');
    if (tagsAnnotation && typeof tagsAnnotation.description === 'string') {
      try {
        tags = JSON.parse(tagsAnnotation.description);
      } catch (e) {
        tags = [];
      }
    }

    // 清洗标题：去掉用来筛选的 @tag 前缀
    title = title.replace(/@\w+\s*/g, '').trim();

    const projectPathAnnotation = test.annotations.find(a => a.type === 'projectPath');
    const filePath = (projectPathAnnotation && typeof projectPathAnnotation.description === 'string')
      ? projectPathAnnotation.description
      : test.location.file;

    const projectName = test.parent.project()?.name;

    if (filePath && (filePath.includes('-api.yaml') || filePath.includes('api.test') || (projectName && projectName.includes('-api')))) {
      type = 'api';
    }

    if (test.title === 'authenticate' || test.title === '用户认证' || test.title.includes('auth.setup')) {
      title = '全局身份验证存储';
      module = '系统配置';
      category = 'setup';
      type = 'setup';
    }

    // 从 annotations 提取模块名称
    const moduleAnnotation = test.annotations.find(a => a.type === 'module');
    if (moduleAnnotation && moduleAnnotation.description) {
      module = moduleAnnotation.description;
    }

    return { title, module, category, type, tags };
  }

  private collectSteps(steps: TestStep[], testType: string, resultAttachments: any[]): any[] {
    return steps
      .filter(s => s.category === 'test.step')
      .map(s => {
        // 为该步骤寻找特定的断言附件
        const assertsName = `Step Asserts: ${s.title}`;
        const assertAttachment = resultAttachments.find(a => a.name === assertsName);
        let passedAsserts = null;
        if (assertAttachment && assertAttachment.body) {
          try {
            passedAsserts = JSON.parse(assertAttachment.body);
          } catch (e) {
            passedAsserts = null;
          }
        }

        return {
          title: s.title,
          duration: s.duration,
          status: s.error ? 'failed' : 'passed',
          steps: s.steps ? this.collectSteps(s.steps, testType, resultAttachments) : [],
          testType: testType,
          passedAsserts: passedAsserts
        };
      });
  }

  async onEnd(result: FullResult) {
    try {
      const now = new Date();
      const stats = this.calculateStats();

      // 优先从环境变量读取 Playwright 配置中生成的统一输出目录
      const runReportDir = process.env.RUN_REPORT_DIR
        ? path.isAbsolute(process.env.RUN_REPORT_DIR)
          ? process.env.RUN_REPORT_DIR
          : path.join(process.cwd(), process.env.RUN_REPORT_DIR)
        : path.join(process.cwd(), 'output', 'reports', `run_${this.formatDate(now, 'yyyyMMdd_HHmmss')}`);

      const timestampId = this.formatDate(now, 'yyyyMMddHHmmss');
      const executionId = `${timestampId}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      // 内部结构调整：精品报告放在 premium-report 子目录下
      const premiumReportDir = path.join(runReportDir, 'premium-report');
      const attachmentsDir = path.join(premiumReportDir, 'attachments');

      [runReportDir, premiumReportDir, attachmentsDir].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      });

      this.harvestAssets(attachmentsDir);

      const modulesMap = new Map();
      this.tests.forEach((t: any) => {
        if (t.category === 'setup') return;
        const key = `${t.type}::${t.module}`;
        if (!modulesMap.has(key)) modulesMap.set(key, { name: t.module, type: t.type || 'ui', total: 0, passed: 0, failed: 0 });
        const m = modulesMap.get(key);
        m.total++;
        if (t.status === 'passed') m.passed++;
        else if (t.status === 'failed' || t.status === 'timedOut') m.failed++;
      });
      const modules = Array.from(modulesMap.values());
      const uiModules = modules.filter(m => m.type === 'ui');
      const apiModules = modules.filter(m => m.type === 'api');

      // 检测是否为混合执行 (UI + API)
      const hasUI = this.tests.some(t => t.type === 'ui');
      const hasAPI = this.tests.some(t => t.type === 'api');

      let finalProjectTitle = 'WebHeal AI';
      if (hasUI && hasAPI) finalProjectTitle = 'WebHeal AI (全栈验证)';
      else if (hasAPI) finalProjectTitle = 'WebHeal AI (API)';
      else if (hasUI) finalProjectTitle = 'WebHeal AI (UI)';

      const dataEngine = DataEngine.getInstance();
      const testEnvData = dataEngine.getMergedData();
      const testEnv = process.env.test_env || 'preprod';
      const uiBase = testEnvData.config?.uiBase || 'Unknown';

      const reportData = {
        projectTitle: finalProjectTitle,
        executionId: executionId,
        testEnv: testEnv,
        uiBase: uiBase,
        summary: { ...stats, startTime: now.toLocaleString('zh-CN') },
        modules: modules,
        uiModules: uiModules,
        apiModules: apiModules,
        tests: this.tests
      };

      const html = this.generateHtml(reportData);

      // 写入当前执行目录下的报告
      const reportFile = path.join(premiumReportDir, 'index.html');
      fs.writeFileSync(reportFile, html);

      // 维护 Latest 快捷入口
      const latestDir = path.join(path.dirname(runReportDir), 'latest');
      if (fs.existsSync(latestDir)) {
        try { fs.rmSync(latestDir, { recursive: true, force: true }); } catch (e) { }
      }

      // 复制到 latest
      if (!fs.existsSync(latestDir)) fs.mkdirSync(latestDir, { recursive: true });
      fs.cpSync(premiumReportDir, latestDir, { recursive: true });

      console.log(`\n[PremiumReporter] ✅ 精品报告整合完成:`);
      console.log(`- 本次执行目录: ${runReportDir}`);
      console.log(`- 精品报告地址: ${reportFile}`);
      console.log(`- 最新报告快捷入口: ${path.join(latestDir, 'index.html')}\n`);

      // 自动整理 Allure 结果到同一执行目录，擦拭多余垃圾文件
      this.consolidateAllureResults(runReportDir, executionId);
    } catch (error) {
      console.error(`[PremiumReporter] ❌ 生成报告时发生错误:`, error);
    }
  }


  private findStepRecursive(steps: any[], title: string): any {
    for (const step of steps) {
      if (step.title === title) return step;
      if (step.steps && step.steps.length > 0) {
        const found = this.findStepRecursive(step.steps, title);
        if (found) return found;
      }
    }
    return null;
  }

  private harvestAssets(destDir: string) {
    this.tests.forEach(test => {
      test.attachments.forEach((attachment: any, idx: number) => {
        if (attachment.path && fs.existsSync(attachment.path) && attachment.contentType?.startsWith('image/')) {
          const safeModule = test.module.replace(/[\\/:*?"<>|]/g, '_');
          const safeTitle = test.title.replace(/[\\/:*?"<>|]/g, '_');
          const fileName = `${safeModule}-${safeTitle}-${idx + 1}.png`;
          const destPath = path.join(destDir, fileName);

          try {
            fs.copyFileSync(attachment.path, destPath);
            const relativePath = `./attachments/${fileName}`;

            // 优化：优先使用名称匹配实现“自愈式”关联
            if (attachment.name && attachment.name.startsWith('Step Screenshot: ')) {
              const targetStepTitle = attachment.name.replace('Step Screenshot: ', '');
              const matchedStep = this.findStepRecursive(test.steps, targetStepTitle);
              if (matchedStep) {
                matchedStep.relativeScreenshotPath = relativePath;
                return; // 匹配成功
              }
            }

            // 兼容逻辑：如果是传统的全局截图（如 failure 截图），仍然保留原有的关联或存储
            if (test.steps.length > 0) {
              const stepIdx = Math.min(idx, test.steps.length - 1);
              if (!test.steps[stepIdx].relativeScreenshotPath) {
                test.steps[stepIdx].relativeScreenshotPath = relativePath;
              }
            }
          } catch (e) {
            console.warn(`[PremiumReporter] Failed to copy screenshot: ${attachment.path}`);
          }
        } else if (attachment.name && attachment.name.startsWith('API Response: ') && attachment.body) {
          // 处理 API 响应体（文本/JSON）
          const targetStepTitle = attachment.name.replace('API Response: ', '');
          const matchedStep = this.findStepRecursive(test.steps, targetStepTitle);
          if (matchedStep) {
            matchedStep.apiResponseBody = attachment.body;
          }
        }
      });
    });
  }

  private calculateStats() {
    const businessTests = this.tests.filter(t => t.category === 'business');
    const total = businessTests.length;
    const passed = businessTests.filter(t => t.status === 'passed').length;
    const failed = businessTests.filter(t => t.status === 'failed' || t.status === 'timedOut').length;
    const skipped = businessTests.filter(t => t.status === 'skipped').length;
    const duration = Date.now() - this.startTime;

    // 计算环境准备状态
    const setupTests = this.tests.filter(t => t.category === 'setup');
    const setupFailed = setupTests.some(t => t.status === 'failed' || t.status === 'timedOut');
    const setupReady = setupTests.length > 0 ? (setupFailed ? 'error' : 'ready') : 'ready';

    return {
      total, passed, failed, skipped,
      duration: (duration / 1000).toFixed(2) + 's',
      status: (failed > 0 || setupFailed) ? 'FAILED' : 'PASSED',
      setupStatus: setupReady
    };
  }

  private formatDate(date: Date, format: string): string {
    const map: { [key: string]: string } = {
      yyyy: date.getFullYear().toString(),
      MM: (date.getMonth() + 1).toString().padStart(2, '0'),
      dd: date.getDate().toString().padStart(2, '0'),
      HH: date.getHours().toString().padStart(2, '0'),
      mm: date.getMinutes().toString().padStart(2, '0'),
      ss: date.getSeconds().toString().padStart(2, '0'),
    };
    return format.replace(/yyyy|MM|dd|HH|mm|ss/g, matched => map[matched]);
  }

  /**
   * 清洗 ANSI 控制字符 (如 [2m, [31m 等)，提升报告阅读体验
   */
  private stripAnsi(text?: string): string | undefined {
    if (!text) return text;
    // eslint-disable-next-line no-control-regex
    return text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
  }

  /**
   * 解析业务语义化错误，将技术堆栈转化为"期望 vs 实际"
   */
  private parseSemanticError(errorMessage?: string): { expected: string; actual: string; suggestion: string } | null {
    if (!errorMessage) return null;
    const cleanMsg = this.stripAnsi(errorMessage) || '';

    // ====== 匹配 API 断言失败: "Assertion Failed on key: xxx" ======
    const apiAssertKeyMatch = cleanMsg.match(/Assertion Failed on key:\s*(.+)/);
    if (apiAssertKeyMatch) {
      const fieldName = apiAssertKeyMatch[1].trim();
      const expectedMatch = cleanMsg.match(/Expected:\s*(.*)/);
      const receivedMatch = cleanMsg.match(/Received:\s*(.*)/);

      return {
        expected: `接口响应字段 "${fieldName}" 的期望值为【${expectedMatch?.[1]?.trim() || '未知'}】`,
        actual: `接口实际返回值为【${receivedMatch?.[1]?.trim() || '未知'}】`,
        suggestion: `接口断言失败：请确认字段 "${fieldName}" 的返回值是否符合业务预期，或检查 YAML 中 asserts 的期望值配置是否正确。`
      };
    }

    // ====== 匹配 UI 断言失败: expect(...).toBeVisible() / toHaveText() 等 ======
    if (cleanMsg.includes('expect(') && cleanMsg.includes('failed')) {
      const locatorMatch = cleanMsg.match(/Locator: (.*)\n/) || cleanMsg.match(/locator\("(.*)"\)/);
      const expectedMatch = cleanMsg.match(/Expected:\s*(.*)/);
      const receivedMatch = cleanMsg.match(/Received:\s*(.*)/);
      const timeoutMatch = cleanMsg.match(/Timeout:\s*(.*)/);

      const target = locatorMatch ? locatorMatch[1].trim() : '';

      // 从 Locator 描述中智能提取文本关键词
      const textMatch = target.match(/getByText\(['"](.+?)['"]\)/) || target.match(/hasText:\s*['"](.+?)['"]/);
      const roleMatch = target.match(/getByRole\(['"](.+?)['"].*?name:\s*['"](.+?)['"]/);
      const placeholderMatch = target.match(/getByPlaceholder\(['"](.+?)['"]\)/);

      // 提取原始 expected 值并翻译
      const rawExpected = expectedMatch?.[1]?.trim() || '';
      const expectedMap: Record<string, string> = {
        'visible': '可见', 'hidden': '隐藏', 'attached': '已挂载',
        'detached': '已卸载', 'enabled': '可用', 'disabled': '禁用',
        'checked': '已勾选', 'unchecked': '未勾选', 'editable': '可编辑',
        'focused': '已聚焦', 'empty': '为空'
      };
      const friendlyState = expectedMap[rawExpected] || null;

      // ========== 构建 EXPECTED ==========
      let expectedText: string;
      let targetKeyword = '';

      if (textMatch) {
        targetKeyword = textMatch[1];
        expectedText = `断言预期为：「${targetKeyword}」`;
      } else if (roleMatch) {
        targetKeyword = roleMatch[2];
        expectedText = `断言预期为「${targetKeyword}」的 ${roleMatch[1]} 元素`;
      } else if (placeholderMatch) {
        targetKeyword = placeholderMatch[1];
        expectedText = `断言预期为「${targetKeyword}」的输入框`;
      } else if (friendlyState) {
        const shortTarget = target.length > 40 ? target.substring(0, 40) + '...' : (target || '目标元素');
        expectedText = `断言预期「${shortTarget}」应处于【${friendlyState}】状态`;
      } else {
        expectedText = `断言预期值为【${rawExpected}】`;
      }

      // ========== 构建 ACTUAL ==========
      let actualText: string;
      if (timeoutMatch) {
        const timeout = timeoutMatch[1].trim();
        if (targetKeyword) {
          actualText = `在定位超时（${timeout}）后仍无法在视口中检测到「${targetKeyword}」`;
        } else {
          actualText = `在元素定位超时（${timeout}）后仍无法在视口中检测到`;
        }
      } else if (receivedMatch) {
        const received = receivedMatch[1].trim();
        if (targetKeyword) {
          actualText = `页面中未找到「${targetKeyword}」，实际内容为「${received}」`;
        } else {
          actualText = `实际值为【${received}】`;
        }
      } else {
        actualText = '页面实时状态与预设条件不符';
      }

      // ========== 构建 SUGGESTION ==========
      const suggestion = target
        ? `定位失败：请核对 HTML 结构中 "${target}" 的选择器路径在当前环境下是否依然有效。`
        : '请检查页面结构是否发生变更，导致预期元素无法定位。';

      return { expected: expectedText, actual: actualText, suggestion };
    }

    return null;
  }

  private generateConclusion(stats: any, modules: any[], uiModules: any[], apiModules: any[]): string {
    const passRate = Math.round((stats.passed / stats.total) * 100);
    const summaryText = `本次自动化回归测试共执行 ${stats.total} 条用例，通过率 ${passRate}%。`;

    let uiCard = '';
    if (uiModules.length > 0) {
      const uiTotal = uiModules.reduce((s: number, m: any) => s + m.total, 0);
      const uiPassed = uiModules.reduce((s: number, m: any) => s + m.passed, 0);
      const uiFailed = uiModules.reduce((s: number, m: any) => s + m.failed, 0);
      const uiRate = Math.round((uiPassed / uiTotal) * 100);
      const uiNames = uiModules.map((m: any) => m.name).join('、');

      let desc = '';
      if (uiFailed === 0) {
        desc = `共 ${uiTotal} 条，覆盖 ${uiNames}，全部通过（${uiRate}%）。`;
      } else {
        const failNames = uiModules.filter((m: any) => m.failed > 0).map((m: any) => m.name).join('、');
        desc = `共 ${uiTotal} 条，${uiPassed} 通过 / ${uiFailed} 失败（${uiRate}%），失败集中在 ${failNames}。`;
      }

      uiCard = `
      <div class="tc-card">
        <div class="tc-card-icon ui">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        </div>
        <div class="tc-card-content">
          <div class="tc-card-title">UI 自动化</div>
          <div class="tc-card-desc">${desc}</div>
        </div>
      </div>`;
    }

    let apiCard = '';
    if (apiModules.length > 0) {
      const apiTotal = apiModules.reduce((s: number, m: any) => s + m.total, 0);
      const apiPassed = apiModules.reduce((s: number, m: any) => s + m.passed, 0);
      const apiFailed = apiModules.reduce((s: number, m: any) => s + m.failed, 0);
      const apiRate = Math.round((apiPassed / apiTotal) * 100);
      const apiNames = apiModules.map((m: any) => m.name).join('、');

      let desc = '';
      if (apiFailed === 0) {
        desc = `共 ${apiTotal} 条，覆盖 ${apiNames}，全部通过（${apiRate}%）。`;
      } else {
        const failNames = apiModules.filter((m: any) => m.failed > 0).map((m: any) => m.name).join('、');
        desc = `共 ${apiTotal} 条，${apiPassed} 通过 / ${apiFailed} 失败（${apiRate}%），失败集中在 ${failNames}。`;
      }

      apiCard = `
      <div class="tc-card">
        <div class="tc-card-icon api">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </div>
        <div class="tc-card-content">
          <div class="tc-card-title">API 自动化</div>
          <div class="tc-card-desc">${desc}</div>
        </div>
      </div>`;
    }

    const isSuccess = stats.failed === 0;
    const footerMsg = isSuccess ? '系统核心功能运行稳定，建议按计划发布。' : '建议优先排查失败模块后再行发布。';
    const footerStatus = isSuccess ? 'success' : 'danger';
    const footerIcon = isSuccess
      ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
      : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

    return `
    <div class="test-conclusion-container">
      <div class="tc-header">
        <div class="tc-icon-circle">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        </div>
        <h3>测试结论</h3>
      </div>
      <p class="tc-summary">${summaryText}</p>
      
      <div class="tc-cards-grid">
        ${uiCard}
        ${apiCard}
      </div>
      
      <div class="tc-footer ${footerStatus}">
        ${footerIcon}
        <span>${footerMsg}</span>
      </div>
    </div>
    `;
  }

  private generateHtml(data: any): string {
    const statusColor = data.summary.status === 'FAILED' ? '#ef4444' : '#10b981';
    const conclusion = this.generateConclusion(data.summary, data.modules, data.uiModules, data.apiModules);

    const userIconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.projectTitle} - 专业测试报告</title>
    ${getReportStyles()}
</head>
<body>
    <div class="app-layout" id="app-layout">
        <!-- Sidebar Toggle (在 app-layout 层级) -->
        <button class="sidebar-toggle" onclick="toggleSidebar()" title="收起/展开导航">
          <span class="toggle-arrow">‹</span>
        </button>

        <!-- Sidebar Navigation -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="brand">
                  <div class="logo-box">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>
                  </div>
                  <h2>${data.projectTitle}</h2>
                </div>
                <div class="module-search">
                  <input type="text" id="module-filter" placeholder="搜索功能模块..." oninput="filterModules()">
                </div>
            </div>
            <nav class="sidebar-nav">
                <div class="nav-item active" onclick="filterByModule('all', this)">
                    <span class="nav-icon">📁</span>
                    <span class="nav-label">全部用例</span>
                    <span class="nav-count">${data.summary.total}</span>
                </div>
                ${data.uiModules.length > 0 ? `
                <div class="nav-group">
                  <div class="nav-group-header" onclick="toggleNavGroup(this)">
                    <span class="nav-group-arrow">›</span>
                    <span class="nav-icon">🌐</span>
                    <span class="nav-label">UI 自动化</span>
                    <span class="nav-count">${data.uiModules.reduce((s: number, m: any) => s + m.total, 0)}</span>
                  </div>
                  <div class="nav-group-children">
                    ${data.uiModules.map((m: any) => `
                    <div class="nav-item nav-child" onclick="filterByModule('${m.name}', this)" data-module-name="${m.name}">
                        <span class="nav-icon">${m.failed > 0 ? '❌' : '📂'}</span>
                        <span class="nav-label">${m.name}</span>
                        <span class="nav-count">${m.total}</span>
                    </div>`).join('')}
                  </div>
                </div>` : ''}
                ${data.apiModules.length > 0 ? `
                <div class="nav-group">
                  <div class="nav-group-header" onclick="toggleNavGroup(this)">
                    <span class="nav-group-arrow">›</span>
                    <span class="nav-icon">⚡</span>
                    <span class="nav-label">API 自动化</span>
                    <span class="nav-count">${data.apiModules.reduce((s: number, m: any) => s + m.total, 0)}</span>
                  </div>
                  <div class="nav-group-children">
                    ${data.apiModules.map((m: any) => `
                    <div class="nav-item nav-child" onclick="filterByModule('${m.name}', this)" data-module-name="${m.name}">
                        <span class="nav-icon">${m.failed > 0 ? '❌' : '📂'}</span>
                        <span class="nav-label">${m.name}</span>
                        <span class="nav-count">${m.total}</span>
                    </div>`).join('')}
                  </div>
                </div>` : ''}
            </nav>
            <div class="sidebar-footer">
                <div class="execution-info">
                  <div class="exec-label">EXECUTION ID</div>
                  <div class="exec-value">${data.executionId}</div>
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <div class="scroll-area">
                <div class="content-wrapper">
                    <!-- Premium Header Card -->
                    <div class="premium-header-card">
                       <div class="header-main-info">
                          <div class="status-summary">
                             <div class="status-indicator" style="background: ${statusColor}"></div>
                             <span class="status-text" style="color: ${statusColor}">${data.summary.status}</span>
                             
                             <span class="status-divider">|</span>
                             <span class="env-dot-small ${data.testEnv}"></span>
                             <span class="env-name-small ${data.testEnv}">${data.testEnv.toUpperCase()}</span>
                             <a href="${data.uiBase}" target="_blank" class="env-link-small">${data.uiBase}</a>
                          </div>
                          <h1>${data.projectTitle} 自动化测试报告</h1>
                          <div class="test-conclusion-wrapper">
                             ${conclusion}
                          </div>
                       </div>
                       
                       <div class="header-actions">
                          <div class="env-status ${data.summary.setupStatus === 'ready' ? 'ready' : (data.summary.setupStatus === 'error' ? 'error' : 'warning')}">
                            <span class="env-status-dot"></span>
                            <span class="env-text">状态: ${data.summary.setupStatus === 'ready' ? '就绪' : (data.summary.setupStatus === 'error' ? '异常' : '准备中')}</span>
                          </div>
                          <button class="btn btn-outline" onclick="openShareModal()">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                            分享
                          </button>
                          <button class="btn btn-primary" onclick="window.print()">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            导出报告
                          </button>
                       </div>

                       <div class="header-stats-grid" style="position: absolute; bottom: 40px; left: 40px; width: calc(100% - 80px); display: none;">
                          <!-- Hidden legacy stats area if needed, but we used flex for header now -->
                       </div>
                    </div>
                    
                    <!-- Modified stats area to include the summary row inside header logic if preferred, 
                         but keeping stats-cards-grid for premium look -->

                    <!-- Stats Cards Grid -->
                    <div class="stats-cards-grid">
                        ${this.renderPremiumStatCard('成功用例', data.summary.passed, 'passed', '✓')}
                        ${this.renderPremiumStatCard('失败用例', data.summary.failed, 'failed', '×')}
                        ${this.renderPremiumStatCard('跳过用例', data.summary.skipped, 'skipped', '-')}
                        ${this.renderPremiumStatCard('通过率', Math.round((data.summary.passed / data.summary.total) * 100) + '%', 'percent', '%')}
                    </div>

                    <!-- Test Content Section -->
                    <div class="content-section">
                        <div class="section-top-info">
                           <h2 id="current-module-title">全部执行详情</h2>
                           <div class="count-badge" id="visible-count">${data.summary.total}</div>
                           
                           <!-- Added Type Filter buttons -->
                           <div class="type-filter-group" style="margin-left:auto; display:flex; gap:8px;">
                             <button class="type-filter-btn active" onclick="filterByType('all', this)">全部</button>
                             <button class="type-filter-btn" onclick="filterByType('ui', this)">UI 用例</button>
                             <button class="type-filter-btn" onclick="filterByType('api', this)">API 用例</button>
                           </div>

                           <div class="search-container" style="max-width: 250px;">
                             <span class="search-icon">🔍</span>
                             <input type="text" id="case-search" placeholder="搜索用例名称..." oninput="handleSearch()">
                           </div>
                        </div>
                        <div class="test-grid" id="test-container">
                            ${data.tests.map((test: any) => this.renderTestCard(test)).join('')}
                        </div>
                        <div id="no-results" class="empty-state" style="display: none;">
                          <div class="empty-illustration">📭</div>
                          <p>没有找到相关匹配的测试结果</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Share Modal -->
    <div class="modal-overlay" id="share-modal" onclick="closeShareModal()">
        <div class="share-card-container" onclick="event.stopPropagation()">
            <div class="share-card-header">
                <div class="logo-box" style="margin: 0 auto 16px; background: var(--brand); color: #fff; border-radius: 12px; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(99, 102, 241, 0.2);">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>
                </div>
                <h2>${data.projectTitle} 测试成果</h2>
                <p>执行 ID: ${data.executionId}</p>
            </div>
            
            <div class="share-stats-grid">
                <div class="share-stat-item">
                    <span class="share-stat-val" style="color: var(--success)">${data.summary.passed}</span>
                    <span class="share-stat-lab">成功</span>
                </div>
                <div class="share-stat-item">
                    <span class="share-stat-val" style="color: var(--danger)">${data.summary.failed}</span>
                    <span class="share-stat-lab">失败</span>
                </div>
                <div class="share-stat-item">
                    <span class="share-stat-val" style="color: #64748b">${data.summary.skipped}</span>
                    <span class="share-stat-lab">跳过</span>
                </div>
                <div class="share-stat-item">
                    <span class="share-stat-val" style="color: var(--brand)">${Math.round((data.summary.passed / data.summary.total) * 100)}%</span>
                    <span class="share-stat-lab">通过率</span>
                </div>
            </div>
            
            <div class="share-card-footer">
                <button class="close-modal-btn" onclick="closeShareModal()">我知道了</button>
                <p class="share-hint">提示：可以使用系统截图分享此卡片</p>
            </div>
        </div>
    </div>

    ${getReportScripts()}
</body>
</html>`;
  }

  private renderPremiumStatCard(label: string, value: any, type: string, icon: string) {
    return `
    <div class="stat-card-premium ${type}">
        <div class="stat-card-inner">
           <div class="stat-icon-circle">${icon}</div>
           <div class="stat-content">
              <span class="stat-val">${value}</span>
              <span class="stat-lab">${label}</span>
           </div>
        </div>
        <div class="stat-card-pattern"></div>
    </div>`;
  }

  private renderTestCard(test: any) {
    const statusColor = test.status === 'passed' ? 'var(--success)' : 'var(--danger)';

    // 根据用例类型选择图标
    let statusIcon = test.status === 'passed' ? '✓' : '×';
    if (test.type === 'api') statusIcon = '⚡';
    else if (test.type === 'ui') statusIcon = '🌐';

    let typeBadge = '';
    if (test.type === 'api') typeBadge = '<span class="type-tag api-tag">[API Test]</span>';
    else if (test.type === 'ui') typeBadge = '<span class="type-tag ui-tag">[UI Test]</span>';

    // 生成标签徽章
    const tagBadges = (test.tags || []).map((tag: string) => {
      const lowerTag = tag.toLowerCase();
      let colorClass = 'tag-default';
      if (lowerTag === 'p0') colorClass = 'tag-p0';
      else if (lowerTag === 'p1') colorClass = 'tag-p1';
      else if (lowerTag === 'smoke') colorClass = 'tag-smoke';
      else if (lowerTag === 'regression') colorClass = 'tag-regression';

      return `<span class="tag-badge ${colorClass}">${tag}</span>`;
    }).join('');

    return `
    <div class="test-card" data-module="${test.module}" data-title="${test.title}" data-type="${test.type}">
        <div class="test-card-header" onclick="toggleAllSteps(this)">
            <div class="test-info-row">
               ${typeBadge}
               <span class="module-chip">${test.module}</span>
               ${tagBadges}
               ${test.category === 'setup' ? '<span class="setup-tag">SETUP</span>' : ''}
               <span class="duration-chip">${(test.duration / 1000).toFixed(2)}s</span>
            </div>
            <div class="test-title-row">
               <div class="status-blob" style="background: ${statusColor}">${statusIcon}</div>
               <h3 class="test-title-text">${test.title}</h3>
               <div class="expand-all-hint">点击展开全步骤</div>
            </div>
        </div>
        <div class="test-card-body">
            <div class="steps-timeline">
                ${test.steps.map((step: any, idx: number) => this.renderStepNode(step, idx, test.type)).join('')}
                ${test.error ? `
                ${test.semanticError ? `
                <div class="semantic-summary">
                  <div class="summary-title">❌ 业务断言未通过</div>
                  <div class="summary-grid">
                    <div class="summary-item">
                      <span class="summary-label">Expected / 预期结果</span>
                      <span class="summary-value">${test.semanticError.expected}</span>
                    </div>
                    <div class="summary-item">
                      <span class="summary-label">Actual / 实际结果</span>
                      <span class="summary-value">${test.semanticError.actual}</span>
                    </div>
                  </div>
                  <div class="suggestion-box">💡 建议：${test.semanticError.suggestion}</div>
                </div>
                ` : ''}
                <details class="error-panel">
                  <summary>点击查看底层异常技术链路 (Debug Info)</summary>
                  <pre>${test.error || 'No error details recorded.'}</pre>
                </details>
` : ''}
            </div>
        </div>
    </div>`;
  }

  private renderStepNode(step: any, index: number, testType?: string) {
    return `
    <div class="step-node">
        <div class="step-line-head" onclick="toggleStep(this)">
            <span class="arrow-icon">›</span>
            <span class="step-marker">${index + 1}</span>
            <span class="step-label">${step.title}</span>
            <span class="step-time">${(step.duration / 1000).toFixed(2)}s</span>
            <span class="step-status-v">PASS</span>
        </div>
        <div class="step-expansion">
            ${step.relativeScreenshotPath && testType !== 'api' ? `
            <div class="evidence-box">
               <div class="evidence-header">实时执行快照</div>
               <img src="${step.relativeScreenshotPath}" alt="Execution Screenshot" loading="lazy">
            </div>` : ''}
            ${step.apiResponseBody ? `
            <div class="evidence-box api-response-box">
               <div class="evidence-header">接口响应体 (Response Body)</div>
               <div class="response-console">
                 <pre><code>${this.escapeHtml(step.apiResponseBody)}</code></pre>
               </div>
            </div>` : ''}
            ${step.passedAsserts ? `
            <div class="semantic-success">
               <div class="success-title">✅ 业务断言验证通过</div>
               <div class="success-grid">
                  ${step.passedAsserts.map((as: any) => `
                    <div class="success-item">
                       <span class="success-marker">✓</span>
                       <div class="success-content">
                          <span class="success-value">字段「${as.key}」预期值为【${as.expected}】，实际符合预期</span>
                       </div>
                    </div>
                  `).join('')}
               </div>
            </div>` : ''}
        </div>
    </div>`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * 将散落在根目录的 Allure 结果兜底整合到统一运行目录，防止污染项目根目录
   */
  private consolidateAllureResults(runDir: string, executionId: string) {
    const rootAllureDir = path.join(process.cwd(), 'allure-results');
    const targetAllureDir = path.join(runDir, 'allure-results');

    if (!fs.existsSync(rootAllureDir)) return;
    if (!fs.existsSync(targetAllureDir)) fs.mkdirSync(targetAllureDir, { recursive: true });

    try {
      const files = fs.readdirSync(rootAllureDir);
      files.forEach(file => {
        const srcPath = path.join(rootAllureDir, file);
        const stats = fs.statSync(srcPath);

        // 只兜底处理最近3分钟内产生的文件
        const threeMinutesAgo = Date.now() - 3 * 60 * 1000;
        if (stats.mtimeMs > threeMinutesAgo) {
          let targetFileName = file;
          if (file.endsWith('-result.json')) {
            targetFileName = `${executionId}_${file}`;
          }
          const destPath = path.join(targetAllureDir, targetFileName);
          fs.copyFileSync(srcPath, destPath);
          fs.unlinkSync(srcPath);
        }
      });
      // 清空空目录作为兜底
      if (fs.readdirSync(rootAllureDir).length === 0) {
        fs.rmdirSync(rootAllureDir);
      }
    } catch (e) {
      console.warn(`[PremiumReporter] ⚠️ 整理兜底 Allure 结果失败:`, e);
    }
  }
}

export default PremiumReporter;
