import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

let cachedRoot: string | null = null;
let cachedVersion: string | null = null;

export function resolvePackageRoot(startDir = path.dirname(fileURLToPath(import.meta.url))): string {
    let current = path.resolve(startDir);
    while (true) {
        if (fs.existsSync(path.join(current, 'package.json'))) {
            return current;
        }
        const parent = path.dirname(current);
        if (parent === current) {
            break;
        }
        current = parent;
    }
    return path.resolve(startDir);
}

export function getAtlasForgeVersion(): string {
    if (cachedVersion) {
        return cachedVersion;
    }

    const root = cachedRoot ?? resolvePackageRoot();
    cachedRoot = root;

    const pkgPath = path.join(root, 'package.json');
    const raw = fs.readFileSync(pkgPath, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const version = parsed.version;

    if (typeof version !== 'string' || version.length === 0) {
        throw new Error(`Invalid package version in ${pkgPath}`);
    }

    cachedVersion = version;
    return version;
}
