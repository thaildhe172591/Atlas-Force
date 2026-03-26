import * as fs from 'node:fs';
import * as path from 'node:path';
import { z } from 'zod';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { AtlasForge } from '../core/facade.js';
import { MEMORY_TYPES } from '../core/models/states.js';

const MCP_VERSION = '0.3.5';
const MCP_AGENT_OPTIONS = ['auto', 'claude', 'gemini', 'codex'] as const;

export const MCP_MEMORY_TYPES = [...MEMORY_TYPES];

const addMemorySchema = z.object({
    title: z.string(),
    summary: z.string(),
    type: z.enum(MEMORY_TYPES),
    what_changed: z.string().optional(),
    why_it_matters: z.string().optional(),
});

const startTaskSchema = z.object({
    summary: z.string().min(1),
});

const searchSchema = z.object({
    query: z.string().min(1),
    limit: z.number().int().positive().max(100).optional(),
});

const closeTaskSchema = z.object({
    summary: z.string().min(1),
});

const initSchema = z.object({
    agent: z.enum(MCP_AGENT_OPTIONS).optional(),
});

export function getMcpTools() {
    return [
        {
            name: 'af_init',
            description: 'Initialize Atlas Forge in the current directory',
            inputSchema: {
                type: 'object',
                properties: {
                    agent: {
                        type: 'string',
                        enum: [...MCP_AGENT_OPTIONS],
                        description: 'Optional agent profile override (auto, claude, gemini, codex)',
                    },
                },
            },
        },
        {
            name: 'af_start_task',
            description: 'Starts a new task session with a summary',
            inputSchema: {
                type: 'object',
                properties: {
                    summary: { type: 'string', description: 'Short summary of the task objectives' },
                },
                required: ['summary'],
            },
        },
        {
            name: 'af_add_memory',
            description: 'Capture a new memory entry',
            inputSchema: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'Descriptive title of the memory' },
                    summary: { type: 'string', description: 'Brief summary of the knowledge' },
                    type: {
                        type: 'string',
                        enum: MCP_MEMORY_TYPES,
                        description: 'The category of this memory',
                    },
                    what_changed: { type: 'string', description: 'Detailed technical description of the change' },
                    why_it_matters: { type: 'string', description: 'Rationale and impact of this decision' },
                },
                required: ['title', 'summary', 'type'],
            },
        },
        {
            name: 'af_search',
            description: 'Search project knowledge base for relevant context',
            inputSchema: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Search query or keywords' },
                    limit: { type: 'number', description: 'Maximum number of results to return', default: 5 },
                },
                required: ['query'],
            },
        },
        {
            name: 'af_close_task',
            description: 'Close the active task session and promote staged memories to canonical store',
            inputSchema: {
                type: 'object',
                properties: {
                    summary: { type: 'string', description: 'Final summary of what was accomplished in this task' },
                },
                required: ['summary'],
            },
        },
        {
            name: 'af_status',
            description: 'Get the current engine status and memory counts',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
    ] as const;
}

function asTextPayload(data: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function formatZodError(err: z.ZodError) {
    return err.issues.map((i) => `${i.path.join('.') || 'input'}: ${i.message}`).join('; ');
}

export class AtlasForgeMcpServer {
    private server: Server;
    private forge: AtlasForge | null = null;
    private rootDir: string;

    constructor(rootDir = process.cwd()) {
        this.rootDir = rootDir;
        this.server = new Server(
            {
                name: 'atlas-forge',
                version: MCP_VERSION,
            },
            {
                capabilities: {
                    tools: {},
                },
            },
        );

        this.setupHandlers();
    }

    private ensureInitialized() {
        const atlasPath = path.join(this.rootDir, '.atlasforge');
        if (!fs.existsSync(atlasPath)) {
            throw new Error('Atlas Forge is not initialized in this workspace. Run `atlas-forge init` first.');
        }
    }

    private async ensureForge() {
        if (!this.forge) {
            this.forge = await AtlasForge.load(this.rootDir, 'auto');
        }
        return this.forge;
    }

    async handleToolCall(name: string, args: unknown) {
        switch (name) {
            case 'af_init': {
                const parsed = initSchema.parse(args ?? {});
                const { forge, bootstrap, agent_profile } = await AtlasForge.initWithReport(this.rootDir, parsed.agent ?? 'auto');
                this.forge = forge;
                return asTextPayload({ ok: true, command: 'af_init', root: this.rootDir, agent_profile, bootstrap });
            }
            case 'af_start_task': {
                this.ensureInitialized();
                const parsed = startTaskSchema.parse(args ?? {});
                const forge = await this.ensureForge();
                const result = await forge.taskStart({ summary: parsed.summary });
                return asTextPayload({
                    ok: true,
                    command: 'af_start_task',
                    session: result.session,
                    preflight: {
                        onboarding_loaded: Boolean(result.preflight.onboarding),
                        architecture_loaded: Boolean(result.preflight.architecture_map),
                        module_map_loaded: Boolean(result.preflight.module_map),
                        related_memories_count: result.preflight.related_memories?.length ?? 0,
                    },
                });
            }
            case 'af_add_memory': {
                this.ensureInitialized();
                const parsed = addMemorySchema.parse(args ?? {});
                const forge = await this.ensureForge();
                const entry = await forge.add({
                    title: parsed.title,
                    summary: parsed.summary,
                    memory_type: parsed.type,
                    what_changed: parsed.what_changed || 'N/A',
                    why_it_matters: parsed.why_it_matters || 'N/A',
                });
                return asTextPayload({
                    ok: true,
                    command: 'af_add_memory',
                    entry: {
                        record_id: entry.record_id,
                        memory_id: entry.memory_id,
                        memory_type: entry.memory_type,
                        title: entry.title,
                    },
                });
            }
            case 'af_search': {
                this.ensureInitialized();
                const parsed = searchSchema.parse(args ?? {});
                const forge = await this.ensureForge();
                const results = await forge.search({
                    query: parsed.query,
                    limit: parsed.limit ?? 5,
                });
                return asTextPayload({
                    ok: true,
                    command: 'af_search',
                    query: parsed.query,
                    limit: parsed.limit ?? 5,
                    count: results.length,
                    results,
                });
            }
            case 'af_close_task': {
                this.ensureInitialized();
                const parsed = closeTaskSchema.parse(args ?? {});
                const forge = await this.ensureForge();
                const result = await forge.taskClose({ summary: parsed.summary });
                return asTextPayload({
                    ok: true,
                    command: 'af_close_task',
                    session: result.session,
                    promoted_count: result.promoted_entries.length,
                    skipped_count: result.skipped_entries.length,
                    doctor: result.doctor,
                });
            }
            case 'af_status': {
                this.ensureInitialized();
                const forge = await this.ensureForge();
                const snapshot = await forge.status();
                const active = await forge.getActiveSession();
                return asTextPayload({
                    ok: true,
                    command: 'af_status',
                    snapshot: snapshot.snapshot,
                    promotion: snapshot.promotion,
                    agent_profile: snapshot.agent_profile,
                    agent_readiness_score: snapshot.agent_readiness_score,
                    level: snapshot.level,
                    gaps: snapshot.gaps,
                    active_session: active,
                });
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }

    private setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: getMcpTools() }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                return await this.handleToolCall(name, args);
            } catch (err: any) {
                if (err instanceof z.ZodError) {
                    return {
                        content: [{ type: 'text', text: `Invalid arguments: ${formatZodError(err)}` }],
                        isError: true,
                    };
                }
                return {
                    content: [{ type: 'text', text: `Error: ${err.message}` }],
                    isError: true,
                };
            }
        });
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Atlas Forge MCP server running on stdio');
    }
}

export async function runMcpServer() {
    const server = new AtlasForgeMcpServer();
    await server.run();
}
