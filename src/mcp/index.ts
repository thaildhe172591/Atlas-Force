import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { AtlasForge } from "../core/facade.js";

/**
 * Atlas Forge MCP Server
 * Enables AI Agents to interact with the project memory layer natively.
 */
class AtlasForgeMcpServer {
    private server: Server;
    private forge: AtlasForge | null = null;
    private rootDir: string;

    constructor() {
        this.rootDir = process.cwd();
        this.server = new Server(
            {
                name: "atlas-forge",
                version: "0.2.1",
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupHandlers();
    }

    private async ensureForge() {
        if (!this.forge) {
            this.forge = await AtlasForge.load(this.rootDir);
        }
        return this.forge;
    }

    private setupHandlers() {
        // 1. List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: "af_init",
                        description: "Initialize Atlas Forge in the current directory",
                        inputSchema: {
                            type: "object",
                            properties: {},
                        },
                    },
                    {
                        name: "af_start_task",
                        description: "Starts a new task session with a summary",
                        inputSchema: {
                            type: "object",
                            properties: {
                                summary: { type: "string", description: "Task objectives" },
                            },
                            required: ["summary"],
                        },
                    },
                    {
                        name: "af_add_memory",
                        description: "Capture a memory entry (decision, module, etc.)",
                        inputSchema: {
                            type: "object",
                            properties: {
                                title: { type: "string" },
                                summary: { type: "string" },
                                type: { type: "string", enum: ["decision", "module", "task-note", "code-pattern"] },
                                what_changed: { type: "string" },
                                why_it_matters: { type: "string" },
                            },
                            required: ["title", "summary", "type"],
                        },
                    },
                    {
                        name: "af_search",
                        description: "Search project knowledge base for context",
                        inputSchema: {
                            type: "object",
                            properties: {
                                query: { type: "string" },
                                limit: { type: "number", default: 5 },
                            },
                            required: ["query"],
                        },
                    },
                    {
                        name: "af_close_task",
                        description: "Close active session and promote memories",
                        inputSchema: {
                            type: "object",
                            properties: {
                                summary: { type: "string", description: "Summary of what was accomplished" },
                            },
                            required: ["summary"],
                        },
                    },
                    {
                        name: "af_status",
                        description: "Get engine status snapshots",
                        inputSchema: {
                            type: "object",
                            properties: {},
                        },
                    },
                ],
            };
        });

        // 2. Call tool
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                switch (name) {
                    case "af_init": {
                        const forge = await AtlasForge.init(this.rootDir);
                        this.forge = forge;
                        return { content: [{ type: "text", text: "Atlas Forge initialized successfully." }] };
                    }

                    case "af_start_task": {
                        const forge = await this.ensureForge();
                        const result = await forge.taskStart({ summary: args?.summary as string });
                        return { content: [{ type: "text", text: `Task session started: ${result.session.session_id}` }] };
                    }

                    case "af_add_memory": {
                        const forge = await this.ensureForge();
                        await forge.add({
                            title: args?.title as string,
                            summary: args?.summary as string,
                            memory_type: args?.type as any,
                            what_changed: args?.what_changed as string,
                            why_it_matters: args?.why_it_matters as string,
                        });
                        return { content: [{ type: "text", text: "Memory captured to staging." }] };
                    }

                    case "af_search": {
                        const forge = await this.ensureForge();
                        const results = await forge.search({
                            query: args?.query as string,
                            limit: (args?.limit as number) || 5,
                        });
                        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
                    }

                    case "af_close_task": {
                        const forge = await this.ensureForge();
                        const result = await forge.taskClose({ summary: args?.summary as string });
                        return { content: [{ type: "text", text: `Task closed. Promoted ${result.promoted_entries.length} entries.` }] };
                    }

                    case "af_status": {
                        const forge = await this.ensureForge();
                        const status = await forge.status();
                        return { content: [{ type: "text", text: JSON.stringify(status, null, 2) }] };
                    }

                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error: ${error.message}` }],
                    isError: true,
                };
            }
        });
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("Atlas Forge MCP server running on stdio");
    }
}

const server = new AtlasForgeMcpServer();
server.run().catch(console.error);
