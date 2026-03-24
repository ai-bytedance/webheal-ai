import { YamlRunner } from '../../../core/engine/yaml-runner';
import { globSync } from 'glob';
import * as path from 'path';

// 递归查找 researchtool 项目下所有以 -api.yaml 结尾的测试用例
const testFiles = globSync(path.join(__dirname, '**/*-api.yaml'));

for (const file of testFiles) {
  YamlRunner.runYaml(file);
}
