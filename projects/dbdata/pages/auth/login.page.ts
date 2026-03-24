import { test, expect, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * LoginPage: dbdata 项目登录页面对象
 */
export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/login/#/');
  }

  async verifyPageTitle(expectedTitle: string) {
    await expect(this.page).toHaveTitle(new RegExp(expectedTitle));
  }

  async login(username: string, password: any) {
    await test.step(`执行登录操作: ${username}`, async () => {
      await this.selfHeal(`输入用户名 "${username}"`, async () => {
        // 优先使用 ID 定位器，兜底使用占位符
        const userField = this.page.locator('#basic_username').or(this.page.getByPlaceholder(/用户名|邮箱|帐号|邮箱地址/));
        await userField.fill(username);
      });
      await this.selfHeal(`输入密码`, async () => {
        const passField = this.page.locator('#basic_password').or(this.page.getByPlaceholder(/密码/));
        await passField.fill(password);
      });
      await this.selfHeal(`点击登录按钮`, async () => {
        // 使用更精确的定位器，处理 "登 录" 中间可能有空格的情况
        await this.page.locator('button').filter({ hasText: /登\s*录|提交/ }).first().click();
      });
    });
  }

  async verifyLoginSuccess(successMsg: string) {
    await test.step(`验证登录成功: ${successMsg}`, async () => {
       // 验证是否包含成功文案或跳转
       await expect(this.page.getByText(successMsg)).toBeVisible();
    });
  }
}
