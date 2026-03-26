import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import type { VerifyCheck, VerifyResult } from '../models/index.js';
import { AtlasForgeConfigSchema } from '../schemas/config.js';

export async function verifyOperation(root: string): Promise<VerifyResult> {
    const checks: VerifyCheck[] = [];
    const atlasRoot = path.join(root, '.atlasforge');
    const requiredDirs = ['staging', 'canonical', 'indexes', 'sessions'];
    const optionalIndexFiles = ['onboarding.md', 'architecture-map.md', 'module-map.md'];

    if (fs.existsSync(atlasRoot)) {
        checks.push({ name: 'root', status: 'pass', message: '.atlasforge directory exists' });
    } else {
        checks.push({ name: 'root', status: 'fail', message: '.atlasforge directory is missing. Run `atlas-forge init`.' });
    }

    for (const dir of requiredDirs) {
        const dirPath = path.join(atlasRoot, dir);
        if (fs.existsSync(dirPath)) {
            checks.push({ name: `dir:${dir}`, status: 'pass', message: `${dir} directory is present` });
        } else {
            checks.push({ name: `dir:${dir}`, status: 'fail', message: `${dir} directory is missing` });
        }
    }

    const configPath = path.join(atlasRoot, 'config.yaml');
    if (!fs.existsSync(configPath)) {
        checks.push({ name: 'config', status: 'fail', message: 'config.yaml is missing' });
    } else {
        try {
            const content = fs.readFileSync(configPath, 'utf-8');
            const parsed = yaml.parse(content);
            AtlasForgeConfigSchema.parse(parsed);
            checks.push({ name: 'config', status: 'pass', message: 'config.yaml is readable and valid' });
        } catch (err: any) {
            checks.push({ name: 'config', status: 'fail', message: `config.yaml is invalid: ${err.message}` });
        }
    }

    const indexRoot = path.join(atlasRoot, 'indexes');
    for (const file of optionalIndexFiles) {
        const p = path.join(indexRoot, file);
        if (fs.existsSync(p)) {
            checks.push({ name: `index:${file}`, status: 'pass', message: `${file} is present` });
        } else {
            checks.push({
                name: `index:${file}`,
                status: 'warn',
                message: `${file} is missing. This is optional but recommended for better agent grounding.`,
            });
        }
    }

    const mcpBinPath = path.join(root, 'dist', 'mcp', 'bin.js');
    if (fs.existsSync(mcpBinPath)) {
        checks.push({ name: 'mcp-binary', status: 'pass', message: 'MCP binary is available at dist/mcp/bin.js' });
    } else {
        checks.push({
            name: 'mcp-binary',
            status: 'warn',
            message: 'MCP binary not found at dist/mcp/bin.js in this workspace. Run `npm run build` for local verification.',
        });
    }

    const ok = !checks.some((c) => c.status === 'fail');
    return { ok, root, checks };
}
