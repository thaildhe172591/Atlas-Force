import * as yaml from 'yaml';
import { FileSystemManager } from './store/fs.js';
import { StagingStore } from './store/staging.js';
import { CanonicalStore } from './store/canonical.js';
import { SessionStore } from './store/sessions.js';
import { bootstrapAdaptiveArtifacts, ConfigLoader, DEFAULTS, evaluateAgentReadiness } from './config/index.js';

import { addOperation } from './operations/add-memory.js';
import { doctorOperation } from './operations/doctor.js';
import { statusOperation } from './operations/status.js';
import { searchOperation } from './operations/retrieval.js';
import { verifyOperation } from './operations/verify.js';
import { taskStartOperation } from './orchestrator/task-start.js';
import { taskCloseOperation } from './orchestrator/task-close.js';
import type {
    AddMemoryOptions,
    TaskStartOptions,
    TaskCloseOptions,
    SearchOptions,
    AtlasForgeConfig,
    DoctorOptions,
    InitBootstrapReport,
    PromotionModeHealth,
    AgentProfile,
    AgentSelection,
} from './models/index.js';

export class AtlasForge {
    private constructor(
        public readonly config: AtlasForgeConfig,
        public readonly promotion_health: PromotionModeHealth,
        public readonly agent_profile: AgentProfile,
        private root: string,
        private fsm: FileSystemManager,
        private staging: StagingStore,
        private canonical: CanonicalStore,
        private sessions: SessionStore
    ) { }

    static async init(root: string): Promise<AtlasForge> {
        const { forge } = await AtlasForge.initWithReport(root, 'auto');
        return forge;
    }

    static async initWithReport(root: string, requestedAgent: AgentSelection = 'auto'): Promise<{ forge: AtlasForge; bootstrap: InitBootstrapReport; agent_profile: AgentProfile }> {
        const fsm = new FileSystemManager(root);
        await fsm.ensureStructure();

        const configPath = 'config.yaml';
        if (!fsm.existsSync(configPath)) {
            fsm.writeText(configPath, yaml.stringify(DEFAULTS));
        }

        const adaptive = bootstrapAdaptiveArtifacts(root, { requestedAgent, dryRun: false });
        const forge = await AtlasForge.load(root);
        return { forge, bootstrap: adaptive.bootstrap, agent_profile: adaptive.agent_profile };
    }

    static async optimizeWithReport(
        root: string,
        requestedAgent: AgentSelection = 'auto',
        dryRun = false
    ): Promise<{ forge: AtlasForge; bootstrap: InitBootstrapReport; agent_profile: AgentProfile }> {
        const fsm = new FileSystemManager(root);
        if (!dryRun) {
            await fsm.ensureStructure();
            const configPath = 'config.yaml';
            if (!fsm.existsSync(configPath)) {
                fsm.writeText(configPath, yaml.stringify(DEFAULTS));
            }
        }

        const adaptive = bootstrapAdaptiveArtifacts(root, { requestedAgent, dryRun });
        const forge = await AtlasForge.load(root);
        return { forge, bootstrap: adaptive.bootstrap, agent_profile: adaptive.agent_profile };
    }

    static async load(root: string, requestedAgent: AgentSelection = 'auto'): Promise<AtlasForge> {
        const fsm = new FileSystemManager(root);
        const load = await ConfigLoader.loadWithMeta(root);
        const agentProfile = bootstrapAdaptiveArtifacts(root, { requestedAgent, dryRun: true }).agent_profile;
        return new AtlasForge(load.config, load.promotion_health, agentProfile, root, fsm, new StagingStore(fsm), new CanonicalStore(fsm), new SessionStore(fsm));
    }

    static async verify(root: string, requestedAgent: AgentSelection = 'auto') { return verifyOperation(root, requestedAgent); }
    async doctor(options: DoctorOptions = {}) { return doctorOperation(options, this.staging, this.fsm); }
    async add(o: AddMemoryOptions) { return addOperation(o, this.staging); }
    async search(o: SearchOptions) { return searchOperation(o, this.canonical); }
    async status(requestedAgent: AgentSelection = 'auto') {
        const requiredAtlasDirs = ['staging', 'canonical', 'indexes', 'sessions'];
        const hasStructure = requiredAtlasDirs.every((dir) => this.fsm.existsSync(dir));
        const hasConfig = this.fsm.existsSync('config.yaml');
        const verifyPassed = hasStructure && hasConfig;
        const readiness = evaluateAgentReadiness(this.root, requestedAgent, verifyPassed, this.promotion_health);
        return statusOperation(this.staging, this.canonical, this.fsm, this.promotion_health, readiness);
    }
    async taskStart(o: TaskStartOptions) { return taskStartOperation(o, this.sessions, this.canonical, this.fsm); }
    async taskClose(o: TaskCloseOptions) { return taskCloseOperation(o, this.sessions, this.staging, this.canonical, this.fsm, this.config.promote_mode); }
    async getActiveSession() { return this.sessions.getActive(); }
}
