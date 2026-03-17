import { YamlRunner } from '../../../../core/engine/yaml-runner';
import * as path from 'path';
import * as fs from 'fs';

const currentDir = __dirname;
if (fs.existsSync(currentDir)) {
  const yamlFiles = fs.readdirSync(currentDir).filter(file => file.endsWith('-api.yaml'));
  for (const file of yamlFiles) {
    const fullPath = path.join(currentDir, file);
    YamlRunner.runYaml(fullPath);
  }
}
