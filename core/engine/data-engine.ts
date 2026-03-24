import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * DataEngine: 框架统一数据引擎 (Single Source of Truth)
 * 负责层级化加载 YAML 配置并处理变量插值
 */
export class DataEngine {
  private static instance: DataEngine;
  private projectRoot: string;
  private testEnv: string;

  private constructor() {
    this.testEnv = process.env.test_env || 'preprod';
    // 默认项目路径
    this.projectRoot = path.join(process.cwd(), 'projects');
  }

  static getInstance(): DataEngine {
    if (!DataEngine.instance) {
      DataEngine.instance = new DataEngine();
    }
    return DataEngine.instance;
  }

  /**
   * 获取合并后的完整测试数据
   * @param projectName 项目名称 (如 researchtool, dbdata)
   * @param yamlPath 触发加载的用例路径 (用于提取模块名)
   * @param caseVariables 用例文件内部定义的变量
   */
  getMergedData(projectName: string = 'researchtool', yamlPath?: string, caseVariables: any = {}): any {
    const currentProjectRoot = path.join(this.projectRoot, projectName);
    const dataDir = path.join(currentProjectRoot, 'data');
    let mergedData: any = {};

    // 提取模块名
    const subModuleName = yamlPath ? yamlPath.match(/tests\/([^/]+)\//)?.[1] : '';

    const loadAndMerge = (dir: string, fileNames: string[]) => {
      fileNames.forEach(name => {
        const filePath = path.join(dir, `${name}.yaml`);
        if (fs.existsSync(filePath)) {
          console.log(`[DataEngine] 正在加载配置: ${filePath}`);
          const content = yaml.load(fs.readFileSync(filePath, 'utf8')) || {};
          mergedData = this.deepMerge(mergedData, content);
        } else if (name === this.testEnv) {
          console.warn(`[DataEngine] 警告: 未找到环境覆盖文件: ${filePath}`);
        }
      });
    };

    // 1. 加载项目公共数据 (Shared -> UI -> API -> Env Override)
    const commonDir = path.join(dataDir, 'common');
    loadAndMerge(commonDir, ['shared', 'ui', 'api', this.testEnv]);

    // 2. 加载业务模块级数据 (优先级高于公共数据)
    if (subModuleName) {
      const moduleDir = path.join(dataDir, subModuleName);
      loadAndMerge(moduleDir, ['shared', 'ui', 'api', this.testEnv]);
    }

    // 3. 合并用例私有变量
    if (caseVariables) {
      mergedData = this.deepMerge(mergedData, caseVariables);
    }

    // 注入调试信息：当前最终生效的环境 URL
    if (mergedData.config) {
      console.log(`[DataEngine] 最终生效 UI 地址: ${mergedData.config.uiBase}`);
      console.log(`[DataEngine] 最终生效 API 地址: ${mergedData.config.apiBase}`);
    }

    return mergedData;
  }

  /**
   * 递归解析变量占位符 ${var}
   */
  interpolate(obj: any, data: any): any {
    if (typeof obj === 'string') {
      const match = obj.trim();
      // 如果字符串纯粹是一个占位符，例如 "${ui.login.entries}"，则返回原始类型（数组或对象）
      if (match.startsWith('${') && match.endsWith('}') && (match.match(/\$\{/g) || []).length === 1) {
        const key = match.substring(2, match.length - 1).trim();
        const val = key.split('.').reduce((o: any, i: string) => (o ? o[i] : undefined), data);
        if (val !== undefined) return val;
      }

      // 否则进行字符串替换
      return obj.replace(/\$\{(.+?)\}/g, (match, key) => {
        const val = key.trim().split('.').reduce((o: any, i: string) => (o ? o[i] : undefined), data);
        return val !== undefined ? val : match;
      });
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.interpolate(item, data));
    } else if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [k, v] of Object.entries(obj)) {
        result[k] = this.interpolate(v, data);
      }
      return result;
    }
    return obj;
  }

  /**
   * 深度合并对象
   */
  private deepMerge(target: any, source: any): any {
    // 如果是数组，直接替换而不是递归合并
    if (Array.isArray(target) || Array.isArray(source)) {
      return source;
    }

    const output = { ...target };
    if (typeof target === 'object' && target !== null && typeof source === 'object' && source !== null) {
      Object.keys(source).forEach(key => {
        if (typeof source[key] === 'object' && source[key] !== null && key in target) {
          output[key] = this.deepMerge(target[key], source[key]);
        } else {
          output[key] = source[key];
        }
      });
    }
    return output;
  }
}
