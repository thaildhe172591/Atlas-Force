import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import { AtlasForgeConfigSchema } from '../schemas/config.js';
import { DEFAULTS } from './defaults.js';
import type { AtlasForgeConfig } from '../models/config.js';

export class ConfigLoader {
    static async load(root: string): Promise<AtlasForgeConfig> {
        const configPath = path.join(root, '.atlasforge', 'config.yaml');
        if (!fs.existsSync(configPath)) return DEFAULTS;

        try {
            const content = fs.readFileSync(configPath, 'utf-8');
            const parsed = yaml.parse(content);
            return AtlasForgeConfigSchema.parse({ ...DEFAULTS, ...parsed }) as AtlasForgeConfig;
        } catch (err) {
            return DEFAULTS;
        }
    }
}
