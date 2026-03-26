import type { SearchOptions, MemoryEntry } from '../models/index.js';
import type { CanonicalStore } from '../store/canonical.js';

export async function searchOperation(o: SearchOptions, c: CanonicalStore): Promise<{ entry: MemoryEntry; score: number; match_reasons: string[] }[]> {
    const all = await c.all();
    const query = o.query.toLowerCase();

    const results = all.map(entry => {
        let score = 0;
        const match_reasons: string[] = [];

        const title = entry.title.toLowerCase();
        const summary = entry.summary.toLowerCase();
        const tags = entry.tags.map(t => t.toLowerCase());
        const whatChanged = entry.what_changed.toLowerCase();

        if (title.includes(query)) {
            score += 3;
            match_reasons.push('matched in title');
        }
        if (summary.includes(query)) {
            score += 2;
            match_reasons.push('matched in summary');
        }
        if (tags.some(t => t.includes(query))) {
            score += 1;
            match_reasons.push('matched in tags');
        }
        if (whatChanged.includes(query)) {
            score += 1;
            match_reasons.push('matched in what_changed');
        }

        return { entry, score, match_reasons };
    });

    return results
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, o.limit || 10);
}

export async function relatedOperation(o: { modules?: string[]; tags?: string[]; limit?: number }, c: CanonicalStore): Promise<{ entry: MemoryEntry; score: number; match_reasons: string[] }[]> {
    const all = await c.all();
    const queryModules = (o.modules || []).map(m => m.toLowerCase());
    const queryTags = (o.tags || []).map(t => t.toLowerCase());

    const results = all.map(entry => {
        let score = 0;
        const match_reasons: string[] = [];

        const entryModules = entry.modules.map(m => m.toLowerCase());
        const entryTags = entry.tags.map(t => t.toLowerCase());

        const sharedModules = entryModules.filter(m => queryModules.includes(m));
        const sharedTags = entryTags.filter(t => queryTags.includes(t));

        if (sharedModules.length > 0) {
            score += sharedModules.length * 2;
            match_reasons.push(`module overlap: ${sharedModules.join(', ')}`);
        }
        if (sharedTags.length > 0) {
            score += sharedTags.length;
            match_reasons.push(`tag overlap: ${sharedTags.join(', ')}`);
        }

        return { entry, score, match_reasons };
    });

    return results
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, o.limit || 5);
}
