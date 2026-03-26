import type { StagingStore } from '../store/staging.js';
import type { CanonicalStore } from '../store/canonical.js';
import type { FileSystemManager } from '../store/fs.js';
import type { StatusSnapshot } from '../models/index.js';

export async function statusOperation(
    staging: StagingStore,
    canonical: CanonicalStore,
    fsm: FileSystemManager
): Promise<{ snapshot: StatusSnapshot }> {
    const sCount = (await staging.getAll()).length;
    const cCount = (await canonical.all()).length;
    return { snapshot: { staging_count: sCount, canonical_count: cCount, stale_count: 0 } };
}
