import { test, expect, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * RegisterPage: dbdata 项目注册页面对象
 */
export class RegisterPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/register');
  }

  async register(data: any) {
    await test.step(`执行注册操作: ${data.username}`, async () => {
      if (data.username) {
        await this.selfHeal(`输入用户名 "${data.username}"`, async () => {
          await this.page.getByPlaceholder(/用户名|主键/).fill(data.username);
        });
      }
      if (data.email) {
        await this.selfHeal(`输入邮箱 "${data.email}"`, async () => {
          await this.page.getByPlaceholder(/邮箱/).fill(data.email);
        });
      }
      if (data.password) {
        await this.selfHeal(`输入密码`, async () => {
          await this.page.getByPlaceholder(/^密码|设置密码/).fill(data.password);
        });
      }
      if (data.confirmPassword) {
        await this.selfHeal(`输入确认密码`, async () => {
          await this.page.getByPlaceholder(/确认密码/).fill(data.confirmPassword);
        });
      }
      await this.selfHeal(`点击注册按钮`, async () => {
        await this.page.getByRole('button', { name: /注册|提交/ }).click();
      });
    });
  }

  async verifyRegisterSuccess(successMsg: string) {
    await test.step(`验证注册成功: ${successMsg}`, async () => {
       await expect(this.page.getByText(successMsg)).toBeVisible();
    });
  }
}
