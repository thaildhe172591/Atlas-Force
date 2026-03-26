import * as fs from 'node:fs';
import * as path from 'node:path';

export class FileSystemManager {
    constructor(private rootDir: string) { }

    getAtlasForgePath(subpath: string = ''): string {
        return path.join(this.rootDir, '.atlasforge', subpath);
    }

    async ensureStructure(): Promise<void> {
        const dirs = ['staging', 'canonical', 'indexes', 'packs', 'handoff', 'sessions'];
        for (const dir of dirs) {
            const p = this.getAtlasForgePath(dir);
            if (!fs.existsSync(p)) {
                fs.mkdirSync(p, { recursive: true });
            }
        }
    }

    // Sync primitives for engine reliability

    listDir(subpath: string): string[] {
        const p = this.getAtlasForgePath(subpath);
        if (!fs.existsSync(p)) return [];
        return fs.readdirSync(p);
    }

    accessSync(subpath: string): void {
        fs.accessSync(this.getAtlasForgePath(subpath));
    }

    existsSync(subpath: string): boolean {
        return fs.existsSync(this.getAtlasForgePath(subpath));
    }

    readText(subpath: string): string {
        return fs.readFileSync(this.getAtlasForgePath(subpath), 'utf-8');
    }

    writeText(subpath: string, content: string): void {
        const p = this.getAtlasForgePath(subpath);
        const dir = path.dirname(p);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(p, content, 'utf-8');
    }

    async readJsonl<T>(subpath: string): Promise<T[]> {
        try {
            const content = this.readText(subpath);
            return content.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
        } catch (err: any) {
            if (err.code === 'ENOENT') return [];
            throw err;
        }
    }

    async writeJsonl<T>(subpath: string, entries: T[]): Promise<void> {
        const content = entries.map(e => JSON.stringify(e)).join('\n') + '\n';
        this.writeText(subpath, content);
    }

    async appendJsonl<T>(subpath: string, entry: T): Promise<void> {
        const p = this.getAtlasForgePath(subpath);
        const content = JSON.stringify(entry) + '\n';
        fs.appendFileSync(p, content, 'utf-8');
    }
}
