import { test, expect, Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

export class LoginPage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/login');
  }

  /**
   * 验证登录页面核心入口渲染
   * @param expectedTexts 可选参数，传入需要验证的文本数组
   */
  async verifyRendering(expectedTexts: string[]) {
    if (!expectedTexts || expectedTexts.length === 0) {
      throw new Error('[LoginPage Error] verifyRendering requires a list of expected labels.');
    }

    const targets = expectedTexts;

    await test.step(`验证页面核心入口: ${targets.join(', ')}`, async () => {
      for (const text of targets) {
        await expect(this.page.getByText(text)).toBeVisible();
      }
    });
  }

  /**
   * 选择登录身份（通过文案匹配，具备自愈能力）
   */
  async selectIdentity(identityLabel: string) {
    await this.selfHeal(
      `在页面中找到并点击 "${identityLabel}" 身份登录入口`,
      async () => {
        await this.page.getByText(identityLabel).click({ timeout: 2000 });
      }
    );
  }

  async verifyLoginHeader(expectedText: string) {
    await expect(this.page.locator('h1, h2, .login-title, .title').filter({ hasText: expectedText }).first()).toBeVisible();
  }

  /**
   * 验证输入框及其占位符是否存在
   */
  async verifyInputWithPlaceholder(label: string, placeholder: string) {
    await test.step(`验证输入框: ${label} (占位符: ${placeholder})`, async () => {
      // 验证标签文本可见
      await expect(this.page.getByText(label, { exact: true })).toBeVisible();
      // 验证对应的占位符输入框可见
      await expect(this.page.getByPlaceholder(placeholder)).toBeVisible();
    });
  }

  /**
   * 验证按钮是否存在
   */
  async verifyButton(buttonLabel: string) {
    await test.step(`验证按钮: ${buttonLabel}`, async () => {
      await expect(this.page.getByRole('button', { name: buttonLabel })).toBeVisible();
    });
  }

  /**
   * 切换到二维码登录 (点击右上角半角图)
   */
  async switchToQRCodeLogin(selector: string) {
    await this.selfHeal(
      '点击右上角图标切换至二维码登录',
      async () => {
        await this.page.locator(selector).click({ timeout: 2000 });
      }
    );
  }

  /**
   * 验证微信二维码渲染展示
   * @param iframeSelector 微信 iframe 选择器
   * @param imageSelector 二维码图片选择器 (在 iframe 内或外)
   */
  async verifyQRCodeVisibility(iframeSelector: string, imageSelector: string) {
    await test.step('验证微信二维码正确渲染', async () => {
      // 等待 iframe 加载
      const iframeLocator = this.page.locator(iframeSelector);
      await expect(iframeLocator).toBeVisible({ timeout: 20000 });

      const iframe = this.page.frameLocator(iframeSelector);
      // 验证二维码图片可见 (微信二维码通常在 iframe 内部)
      await expect(iframe.locator(imageSelector).first()).toBeVisible({ timeout: 20000 });
    });
  }

  /**
   * 切换回密码登录
   */
  async switchToPasswordLogin(selector: string) {
    await this.selfHeal(
      '点击切换回密码登录',
      async () => {
        await this.page.locator(selector).click({ timeout: 2000 });
      }
    );
  }

  /**
   * 根据标签向对应的输入框填入内容
   * @param label 输入框关联的文本标签 (如 "电子邮箱")
   * @param value 待填入的文本值
   */
  async fillInputByLabel(label: string, value: string) {
    await this.selfHeal(
      `在标签 "${label}" 对应的输入框中输入内容`,
      async () => {
        // 先定位到 label 对应的输入框节点
        // 这里采用了一个模糊定位策略：寻找该 label 附近最近的 input 框
        // 也可以直接通过 getByText().locator('..').getByRole('textbox') 组合定位
        const container = this.page.getByText(label, { exact: true }).locator('..');
        const inputLocator = container.locator('input').first();
        
        // 如果无法通过结构查找到，备选直接根据 placeholder 进行定位（前提是外部能传入或有通用规律）
        // 这里基于容错设计，在 selfHeal 内如果定位失败会自动修复
        await inputLocator.fill(value);
      }
    );
  }

  /**
   * 根据占位符向对应的输入框填入内容
   * @param placeholder 输入框的占位符 (如 "请输入电子邮箱")
   * @param value 待填入的文本值
   */
  async fillInputByPlaceholder(placeholder: string, value: string) {
    await this.selfHeal(
      `在占位符为 "${placeholder}" 的输入框中输入内容`,
      async () => {
        await this.page.getByPlaceholder(placeholder).fill(value);
      }
    );
  }

  /**
   * 点击页面上的按钮
   * @param buttonLabel 按钮显示的文本
   */
  async clickButton(buttonLabel: string) {
    await this.selfHeal(
      `点击 "${buttonLabel}" 按钮`,
      async () => {
        await this.page.getByRole('button', { name: buttonLabel }).click();
      }
    );
  }

  /**
   * 勾选用户协议与隐私政策
   */
  async checkAgreement() {
    await this.selfHeal(
      `勾选 "登录即代表同意" 用户协议`,
      async () => {
        // 由于部分环境使用的是非标准无障碍的完全自定义 div（无 input，无 role=checkbox），
        // 最稳妥的方法是通过计算文本的边界框（BoundingBox），使用原生的鼠标点击坐标。
        const labelText = this.page.getByText('登录即代表同意').first();
        const box = await labelText.boundingBox();
        
        if (box) {
          // 1. 尝试点击文本左侧（通常是复选框 UI 的位置）
          await this.page.mouse.click(box.x - 12, box.y + box.height / 2);
          
          await this.page.waitForTimeout(500); // 等待状态更新
          
          // 2. 检查登录按钮是否激活，如果没有激活，说明没点中，尝试点击文案本身
          const isBtnDisabled = await this.page.evaluate(() => {
             const btn = document.querySelector('button.login-btn, button:disabled, button:contains("登录")') as HTMLButtonElement | null;
             // 简单的启发式检查：页面中是否有 button 存在 disabled 属性
             const disabledBtn = document.querySelector('button[disabled]');
             return disabledBtn !== null;
          }).catch(() => false);

          if (isBtnDisabled) {
              await this.page.mouse.click(box.x + Math.min(box.width / 2, 20), box.y + box.height / 2);
              await this.page.waitForTimeout(500);
          }
        } else {
          // 如果因不可见无法获取 boundingBox，尝试 fallback 到通用文本强制点击
          await labelText.click({ force: true }).catch(() => null);
        }
      }
    );
  }

  /**
   * 验证登录成功后的状态 (等待 URL 发生变化或出现登录成功特有的标识)
   * @param successSelector 登录成功后应当可见的元素选择器 (如用户头像、下拉菜单等)
   */
  async verifyLoginSuccess(successSelector: string) {
    await test.step(`验证登录成功状态 (检测元素: ${successSelector})`, async () => {
      // 登录成功后往往会跳转，等待跳出 /login
      await this.page.waitForURL(url => !url.href.includes('/login'), { timeout: 15000 }).catch(() => null);
      
      // 检测成功的徽标或元素
      await expect(this.page.locator(successSelector).first()).toBeVisible({ timeout: 15000 });
    });
  }
}
