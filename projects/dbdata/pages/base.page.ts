import { Page } from '@playwright/test';
import { BasePage as CoreBasePage } from '../../../core/engine/base.page';

/**
 * BasePage: 为 dbdata 项目提供的基础 Page Object 类
 */
export class BasePage extends CoreBasePage {
  constructor(page: Page) {
    super(page);
    this.setProjectName('dbdata');
  }
}
