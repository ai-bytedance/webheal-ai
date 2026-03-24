import { test, expect, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * JournalEvaluationPage: dbdata 期刊评价页面对象
 */
export class JournalEvaluationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await test.step('跳转到期刊评价页面', async () => {
      // 使用绝对路径避免 BaseURL 可能带来的重定向问题
      await this.page.goto('https://www.dbdata.com/journal/#/index');
      
      // 如果重定向到了首页或其他页面，尝试通过点击顶部导航进入
      const searchInput = this.page.locator('input.search-input').or(this.page.getByPlaceholder(/通过期刊名称搜索|通过ISSN搜索|请输入期刊名称/));
      if (!await searchInput.isVisible()) {
        console.log('[dbdata] 页面未直接加载期刊评价，尝试通过菜单点击...');
        const menuJournal = this.page.getByText('期刊评价', { exact: true });
        await menuJournal.click();
      }
      
      // 确保进入了正确的页面
      await expect(searchInput).toBeVisible({ timeout: 10000 });
    });
  }

  /**
   * 切换搜索 Tab (期刊名称/ISSN/出版商)
   */
  async switchToTab(tabName: string) {
    await test.step(`切换到搜索标签: ${tabName}`, async () => {
      await this.selfHeal(`在搜索栏上方点击并切换到 "${tabName}" 标签`, async () => {
        const tab = this.page.locator('.search-tab').filter({ hasText: tabName });
        await tab.click();
        // 验证 Tab 是否激活
        await expect(tab).toHaveClass(/active/);
      });
    });
  }

  async searchJournal(name: string) {
    await test.step(`搜索期刊: ${name}`, async () => {
      await this.selfHeal(`在搜索框中输入期刊名称 "${name}" 并点击查询`, async () => {
        const searchInput = this.page.locator('input.search-input').or(this.page.getByPlaceholder(/通过期刊名称搜索|请输入期刊名称/));
        await searchInput.waitFor({ state: 'visible', timeout: 15000 });
        await searchInput.clear();
        await searchInput.fill(name);
        
        const searchBtn = this.page.locator('button.search-btn').or(this.page.getByRole('button', { name: /查询|搜索/ }));
        await searchBtn.waitFor({ state: 'visible', timeout: 5000 });
        await searchBtn.click();
      });
    });
  }

  async verifySearchResult(expectedName: string) {
    await test.step(`验证搜索结果中包含: ${expectedName}`, async () => {
      await this.selfHeal(`验证列表中出现期刊 "${expectedName}"`, async () => {
        const resultItem = this.page.locator('a.journal-name').filter({ hasText: new RegExp(expectedName, 'i') });
        await expect(resultItem.first()).toBeVisible({ timeout: 15000 });
      });
    });
  }
}
