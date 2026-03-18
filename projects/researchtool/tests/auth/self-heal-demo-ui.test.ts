import { YamlRunner } from '../../../../core/engine/yaml-runner';
import * as path from 'path';
import * as fs from 'fs';

/**
 * AI 自愈演示测试用例
 * 该用例运行演示目录下的所有 -ui.yaml 文件
 */
const currentDir = __dirname;
if (fs.existsSync(currentDir)) {
  const yamlFiles = fs.readdirSync(currentDir).filter(file => file.endsWith('-demo.yaml'));
  for (const file of yamlFiles) {
    const fullPath = path.join(currentDir, file);
    YamlRunner.runYaml(fullPath);
  }
}
