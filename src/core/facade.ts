import * as path from 'node:path';
import * as yaml from 'yaml';
import { FileSystemManager } from './store/fs.js';
import { StagingStore } from './store/staging.js';
import { CanonicalStore } from './store/canonical.js';
import { SessionStore } from './store/sessions.js';
import { ConfigLoader, DEFAULTS } from './config/index.js';

import { addOperation } from './operations/add-memory.js';
import { statusOperation } from './operations/status.js';
import { searchOperation } from './operations/retrieval.js';
import { taskStartOperation } from './orchestrator/task-start.js';
import { taskCloseOperation } from './orchestrator/task-close.js';
import type { AddMemoryOptions, TaskStartOptions, TaskCloseOptions, SearchOptions, AtlasForgeConfig } from './models/index.js';

export class AtlasForge {
    private constructor(
        public readonly config: AtlasForgeConfig,
        private fsm: FileSystemManager,
        private staging: StagingStore,
        private canonical: CanonicalStore,
        private sessions: SessionStore
    ) { }

    static async init(root: string): Promise<AtlasForge> {
        const fsm = new FileSystemManager(root);
        await fsm.ensureStructure();

        const configPath = 'config.yaml';
        if (!fsm.existsSync(configPath)) {
            fsm.writeText(configPath, yaml.stringify(DEFAULTS));
        }

        return AtlasForge.load(root);
    }

    static async load(root: string): Promise<AtlasForge> {
        const fsm = new FileSystemManager(root);
        const config = await ConfigLoader.load(root);
        return new AtlasForge(config, fsm, new StagingStore(fsm), new CanonicalStore(fsm), new SessionStore(fsm));
    }

    async add(o: AddMemoryOptions) { return addOperation(o, this.staging); }
    async search(o: SearchOptions) { return searchOperation(o, this.canonical); }
    async status() { return statusOperation(this.staging, this.canonical, this.fsm); }
    async taskStart(o: TaskStartOptions) { return taskStartOperation(o, this.sessions, this.canonical, this.fsm); }
    async taskClose(o: TaskCloseOptions) { return taskCloseOperation(o, this.sessions, this.staging, this.canonical, this.fsm, this.config.promote_mode); }
    async getActiveSession() { return this.sessions.getActive(); }
}
